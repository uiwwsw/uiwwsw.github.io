import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { advanceAmbientTime } from "../utils/ambientMotion.js";
import {
  clamp,
  TOPICS,
  earthPosition,
  EARTH_RADIUS,
} from "../utils/observatory.js";
import {
  nearbyStars,
  packStarLabels,
  pickBudget,
  transitionStarLabels,
  sameStarLabels,
} from "../utils/starSelection.js";
import {
  STAR_NEAR,
  STAR_EDGE,
  createStarProjector,
  createStarUpdateClock,
  stepStarUpdateClock,
  readSkyObstacles,
} from "../utils/starVisibility.js";

const ignoreRaycast = () => {};
const vertex = `
  attribute vec3 aColor; attribute float aVisible; attribute float aIndex;
  uniform float uSize; uniform float uDetail; uniform float uFocus;
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    float focus = abs(aIndex-uFocus) < .5 ? 1.6 : 1.0;
    gl_PointSize = clamp(uSize * focus / max(1.0, -p.z), 2.0, 60.0);
    gl_Position = projectionMatrix * p;
    vColor = aColor;
    float shimmer = .88 + .12 * sin(uTime * .65 + aIndex * 2.399);
    float nearFade = smoothstep(${STAR_NEAR[0].toFixed(1)}, ${STAR_NEAR[1].toFixed(1)}, -p.z);
    vec2 screen = abs(gl_Position.xy / max(.001, gl_Position.w));
    float edgeFade = 1.0 - smoothstep(${STAR_EDGE[0]}, ${STAR_EDGE[1]}, max(screen.x, screen.y));
    vAlpha = mix(.2, .95, uDetail) * mix(.08, 1.0, aVisible) * shimmer * nearFade * edgeFade * uOpacity;
  }
`;
const fragment = `
  varying vec3 vColor; varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - .5) * 2.0;
    float glow = pow(max(0.0, 1.0-d), 3.0);
    gl_FragColor = vec4(vColor, glow * vAlpha);
    #include <colorspace_fragment>
  }
`;
function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, "rgba(220,240,255,.65)");
  glow.addColorStop(0.45, "rgba(150,190,240,.18)");
  glow.addColorStop(1, "rgba(100,150,230,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

export default function ArticleSky({
  articles,
  paused,
  focus = 0,
  planetPositionRef,
  progress,
  selected,
  highlighted,
  onSelect,
  onNearby,
  inputRef,
  compact,
  sector,
  diagnostics = false,
  onDiagnostics,
}) {
  const { gl, size } = useThree();
  const [labels, setLabels] = useState([]);
  const labelState = useRef([]);
  const [hovered, setHovered] = useState(null);
  const candidates = useRef([]);
  const updateClock = useRef(createStarUpdateClock());
  const frames = useRef(0);
  const lastStats = useRef(0);
  const projectStar = useMemo(createStarProjector, []);
  const planet = useMemo(() => new THREE.Vector3(), []);
  const planetScreen = useMemo(() => new THREE.Vector3(), []);
  const glow = useMemo(glowTexture, []);
  useEffect(() => () => glow.dispose(), [glow]);
  const detail = clamp((progress - 0.06) / 0.34);
  const focusing = focus > 0.05;
  const buffers = useMemo(() => {
    const positions = new Float32Array(articles.length * 3);
    const colors = new Float32Array(articles.length * 3);
    const visibility = new Float32Array(articles.length);
    const indices = new Float32Array(articles.length);
    const color = new THREE.Color();
    articles.forEach((article, i) => {
      positions.set(article.position, i * 3);
      color.set(article.color).toArray(colors, i * 3);
      visibility[i] = !highlighted || highlighted.has(article.id) ? 1 : 0;
      indices[i] = i;
    });
    return { positions, colors, visibility, indices };
  }, [articles, highlighted]);
  const uniforms = useMemo(
    () => ({
      uSize: { value: 600 },
      uDetail: { value: 0 },
      uFocus: { value: -1 },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
    }),
    [],
  );
  useEffect(() => {
    uniforms.uSize.value = size.height * gl.getPixelRatio() * 0.8;
    uniforms.uDetail.value = detail;
    uniforms.uFocus.value = articles.findIndex(
      (article) => article.id === (selected?.id || hovered),
    );
  }, [uniforms, size.height, gl, detail, articles, selected?.id, hovered]);
  const clouds = useMemo(
    () =>
      Object.entries(TOPICS).flatMap(([topic, info]) => {
        const members = articles.filter(
          (article) =>
            article.topic === topic &&
            (!highlighted || highlighted.has(article.id)),
        );
        if (!members.length) return [];
        const position = [0, 1, 2].map(
          (axis) =>
            members.reduce((sum, article) => sum + article.position[axis], 0) /
            members.length,
        );
        // Leave the upper half free for the mobile navigation and Earth.
        if (compact) position[1] -= 7;
        return [
          {
            id: `cloud-${topic}`,
            topic,
            ...info,
            count: members.length,
            position,
          },
        ];
      }),
    [articles, highlighted, compact],
  );

  useFrame(({ camera }, delta) => {
    uniforms.uOpacity.value = 1 - focus;
    uniforms.uTime.value = advanceAmbientTime(
      uniforms.uTime.value,
      delta,
      paused,
    );
    const tick = stepStarUpdateClock(updateClock.current, delta);
    frames.current++;
    if (diagnostics && tick.now - lastStats.current > 1) {
      const fps = Math.round(frames.current / (tick.now - lastStats.current));
      onDiagnostics(
        `${fps} FPS · ${gl.info.render.calls} draws · ${articles.length} stars · ${candidates.current.length} pick targets`,
      );
      frames.current = 0;
      lastStats.current = tick.now;
    }
    if (planetPositionRef) planet.copy(planetPositionRef.current);
    else planet.set(...earthPosition(compact));
    const planetDistance = planet.distanceTo(camera.position);
    planetScreen.copy(planet).project(camera);
    const planetX = ((planetScreen.x + 1) * size.width) / 2;
    const planetY = ((1 - planetScreen.y) * size.height) / 2;
    const planetRadius =
      ((EARTH_RADIUS /
        Math.sqrt(Math.max(1, planetDistance ** 2 - EARTH_RADIUS ** 2))) *
        size.height) /
      (2 * Math.tan((camera.fov * Math.PI) / 360));
    const project = (item) =>
      projectStar(
        item,
        camera,
        size.width,
        size.height,
        sector.id === "home" ? planet : undefined,
        EARTH_RADIUS,
      );
    const projected = articles
      .filter((article) => !highlighted || highlighted.has(article.id))
      .map(project)
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance);
    candidates.current =
      progress > 0.12 && !selected && !focusing
        ? projected.slice(0, pickBudget(compact))
        : [];
    // Picking follows the actual camera every frame. Only layout/React work is
    // throttled. No absolute Fiber time can strand this gate after tab resume.
    if (!tick.layout) return;
    const previous = new Map(labelState.current.map((item) => [item.id, item]));
    const visible =
      progress > 0.12 && !selected && !focusing
        ? packStarLabels(
            projected.map((item) => ({
              ...item,
              offsetX: previous.get(item.id)?.offsetX,
              offsetY: previous.get(item.id)?.offsetY,
            })),
            size.width,
            size.height,
            compact,
            sector.id === "home" && planetScreen.z >= -1 && planetScreen.z <= 1
              ? { x: planetX, y: planetY, radius: planetRadius }
              : undefined,
            [hovered, ...labelState.current.map((item) => item.id)].filter(
              Boolean,
            ),
            readSkyObstacles(
              gl.domElement.closest(".observatory"),
              gl.domElement.getBoundingClientRect(),
            ),
          )
        : [];
    const next = transitionStarLabels(
      labelState.current,
      visible,
      tick.now,
      paused || !!selected,
    );
    labelState.current = next;
    setLabels((previous) => (sameStarLabels(previous, next) ? previous : next));
  });

  useEffect(() => {
    candidates.current = [];
    labelState.current = [];
    updateClock.current.nextLayout = 0;
    setLabels([]);
    setHovered(null);
  }, [sector.id, highlighted, articles]);
  useEffect(() => {
    const canvas = gl.domElement;
    const hits = (event) => {
      const rect = canvas.getBoundingClientRect();
      return nearbyStars(
        candidates.current,
        event.clientX - rect.left,
        event.clientY - rect.top,
        compact,
      );
    };
    const click = (event) => {
      if (inputRef.current.dragged || focusing) return;
      const nearby = hits(event);
      if (nearby.length > 1) onNearby(nearby);
      else if (nearby.length === 1) onSelect(nearby[0]);
    };
    const move = (event) => {
      if (event.pointerType === "touch" || inputRef.current.dragged || focusing)
        return;
      setHovered(hits(event)[0]?.id || null);
    };
    const leave = () => setHovered(null);
    canvas.addEventListener("click", click);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    return () => {
      canvas.removeEventListener("click", click);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
    };
  }, [gl, compact, inputRef, onSelect, onNearby, focusing]);
  return (
    <group>
      <points raycast={ignoreRaycast} frustumCulled={false}>
        <bufferGeometry key={`${sector.id}:${articles.length}`}>
          <bufferAttribute
            attach="attributes-position"
            args={[buffers.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aColor"
            args={[buffers.colors, 3]}
          />
          <bufferAttribute
            attach="attributes-aVisible"
            args={[buffers.visibility, 1]}
          />
          <bufferAttribute
            attach="attributes-aIndex"
            args={[buffers.indices, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={vertex}
          fragmentShader={fragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {clouds.map((cloud) => (
        <sprite
          key={cloud.id}
          position={cloud.position}
          scale={[20, 13, 1]}
          raycast={ignoreRaycast}
        >
          <spriteMaterial
            map={glow}
            color={cloud.color}
            transparent
            opacity={(1 - detail) * 0.22 * (1 - focus)}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
      {labels.map((item) => (
        <Html
          key={item.id}
          position={item.position}
          zIndexRange={[8, 1]}
          style={{
            pointerEvents:
              !focusing && item.leavingAt === null ? "auto" : "none",
            opacity: item.leavingAt !== null ? 0 : 1 - focus,
            transition: "opacity 0.45s ease",
          }}
        >
          <svg
            className="star-connector"
            aria-hidden="true"
            width="1"
            height="1"
          >
            <line
              x1="0"
              y1="0"
              x2={
                item.offsetX > 0
                  ? item.offsetX
                  : item.offsetX + (compact ? 156 : 198)
              }
              y2="0"
            />
            <circle cx="0" cy="0" r="3" />
          </svg>
          <button
            className={`star-label ${item.leavingAt !== null ? "is-leaving" : ""}`}
            data-article-star={item.id}
            tabIndex={!focusing && item.leavingAt === null ? 0 : -1}
            aria-hidden={focusing || item.leavingAt !== null}
            style={{
              "--star-color": item.color,
              left: item.offsetX,
              top: item.offsetY,
            }}
            onClick={() => !focusing && onSelect(item)}
          >
            <span>{TOPICS[item.topic].english}</span>
            <strong>{item.title}</strong>
            <i aria-hidden="true">↗</i>
          </button>
        </Html>
      ))}
    </group>
  );
}
