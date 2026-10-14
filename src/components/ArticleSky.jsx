import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { advanceAmbientTime } from "../utils/ambientMotion.js";
import {
  clamp,
  TOPICS,
} from "../utils/observatory.js";
import {
  nearbyStars,
  pointerStarPriority,
  packStarLabels,
  pickBudget,
  transitionStarLabels,
  sameStarLabels,
} from "../utils/starSelection.js";
import {
  STAR_NEAR,
  STAR_FAR,
  STAR_EDGE,
  createStarProjectionBuffer,
  createStarUpdateClock,
  stepStarUpdateClock,
  readSkyObstacles,
} from "../utils/starVisibility.js";

const ignoreRaycast = () => {};
const vertex = `
  attribute vec3 aColor; attribute float aVisible; attribute float aIndex;
  attribute vec4 aStyle; attribute float aAccent;
  uniform float uSize; uniform float uDetail; uniform float uFocus;
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vColor; varying float vAlpha;
  varying float vShape; varying float vFlare;
  void main() {
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    float focus = abs(aIndex-uFocus) < .5 ? 1.6 : 1.0;
    gl_PointSize = clamp(uSize * aStyle.x * focus / max(1.0, -p.z), 2.0, 60.0);
    gl_Position = projectionMatrix * p;
    vColor = aColor;
    vShape = aStyle.w;
    float wave = .5 + .5 * sin(uTime * 6.283185 / aStyle.z + aStyle.y);
    vFlare = pow(wave, 24.) * (.35 + aAccent * .5);
    float shimmer = .78 + .12 * sin(uTime * .7 + aStyle.y) + vFlare * .35;
    gl_PointSize *= 1. + vFlare * .18;
    float nearFade = smoothstep(${STAR_NEAR[0].toFixed(1)}, ${STAR_NEAR[1].toFixed(1)}, -p.z);
    float farFade = 1.0 - smoothstep(${STAR_FAR[0].toFixed(1)}, ${STAR_FAR[1].toFixed(1)}, -p.z);
    vec2 screen = abs(gl_Position.xy / max(.001, gl_Position.w));
    float edgeFade = 1.0 - smoothstep(${STAR_EDGE[0]}, ${STAR_EDGE[1]}, max(screen.x, screen.y));
    vAlpha = mix(.2, .95, uDetail) * mix(.08, 1.0, aVisible) * shimmer * nearFade * farFade * edgeFade * uOpacity;
  }
`;
const fragment = `
  varying vec3 vColor; varying float vAlpha;
  varying float vShape; varying float vFlare;
  void main() {
    vec2 p = (gl_PointCoord - .5) * 2.;
    float d = length(p);
    float core = 1. - smoothstep(.06, .21, d);
    float halo = exp(-d * d * 9.) * .55;
    vec2 axis = abs(p);
    if (vShape > 2.5) axis = abs(vec2(p.x+p.y, p.y-p.x)) * .7071;
    float rays = (exp(-axis.x * 38.) * exp(-axis.y * 4.) + exp(-axis.y * 38.) * exp(-axis.x * 4.)) * (.18 + vFlare * .4);
    float orbit = exp(-pow((d - .48) * 28., 2.)) * .2;
    float shape = vShape < .5 ? halo * .3 : vShape < 1.5 ? rays : vShape < 2.5 ? orbit : rays * .65;
    float light = clamp(core + halo + shape + vFlare * halo, 0., 1.);
    // A small dark skirt keeps colored points legible over the bright Earth.
    float skirt = exp(-pow((d - .25) * 12., 2.)) * .35;
    vec3 color = mix(vColor, vec3(1.), core * .8);
    color *= light / max(.001, light + skirt);
    gl_FragColor = vec4(color, min(1., light + skirt) * vAlpha * (1. - smoothstep(.85, 1., d)));
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
  const pointer = useRef(null);
  const pointerLabel = useRef(null);
  const pointerLayout = useRef(0);
  const updateClock = useRef(createStarUpdateClock());
  const frames = useRef(0);
  const lastStats = useRef(0);
  const projection = useMemo(
    () =>
      createStarProjectionBuffer(
        articles.filter(
          (article) => !highlighted || highlighted.has(article.id),
        ),
        pickBudget(compact),
      ),
    [articles, highlighted, compact],
  );
  const glow = useMemo(glowTexture, []);
  useEffect(() => () => glow.dispose(), [glow]);
  const detail = clamp((progress - 0.06) / 0.34);
  const focusing = focus > 0.05;
  const buffers = useMemo(() => {
    const positions = new Float32Array(articles.length * 3);
    const colors = new Float32Array(articles.length * 3);
    const visibility = new Float32Array(articles.length);
    const indices = new Float32Array(articles.length);
    const styles = new Float32Array(articles.length * 4);
    const accents = new Float32Array(articles.length);
    const color = new THREE.Color();
    articles.forEach((article, i) => {
      positions.set(article.position, i * 3);
      color.set(article.color).toArray(colors, i * 3);
      visibility[i] = !highlighted || highlighted.has(article.id) ? 1 : 0;
      indices[i] = i;
      const style = article.starStyle;
      styles.set(style ? [style.size, style.phase, style.period, style.shape] : [1, i, 24, 0], i * 4);
      accents[i] = style?.accent || 0;
    });
    return { positions, colors, visibility, indices, styles, accents };
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
    const readable = progress > 0.12 && !selected && !focusing;
    // Reading stars are an overlay, including where the Earth lies behind them.
    // Keep hit testing consistent with the depth-independent point material.
    const { projected, picks } = readable
      ? projection.update(camera, size.width, size.height)
      : projection.clear();
    candidates.current = picks;
    // Desktop hit targets must include the same distant stars the pointer can reveal.
    if (pointer.current) candidates.current = projected;
    if (pointer.current && tick.now >= pointerLayout.current) {
      tick.layout = true;
      pointerLayout.current = tick.now + .075;
    }
    // Picking stays current on every interactive frame, without rebuilding
    // metadata/arrays. Only label layout runs at 5 Hz.
    if (!tick.layout) return;
    const previous = new Map(labelState.current.map((item) => [item.id, item]));
    const visible = readable
      ? packStarLabels(
          projected.map((item) => ({
            ...item,
            offsetX: previous.get(item.id)?.offsetX,
            offsetY: previous.get(item.id)?.offsetY,
          })),
          size.width,
          size.height,
          compact,
          undefined,
          pointer.current
            ? pointerStarPriority(projected, pointer.current, [
                pointerLabel.current,
                gl.domElement.closest(".observatory")?.querySelector(".star-label:focus-visible")?.dataset.articleStar,
              ])
            : [hovered, ...labelState.current.map((item) => item.id)].filter(Boolean),
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
      paused || !!selected || !!pointer.current,
    );
    labelState.current = next;
    setLabels((previous) => (sameStarLabels(previous, next) ? previous : next));
  });

  useEffect(() => {
    candidates.current = [];
    pointer.current = null;
    pointerLabel.current = null;
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
    const surface = canvas.closest(".observatory") || canvas;
    const move = (event) => {
      if (event.pointerType !== "mouse" || event.buttons || focusing) return;
      const rect = canvas.getBoundingClientRect();
      pointer.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      pointerLabel.current = event.target.closest(".star-label")?.dataset.articleStar || null;
      setHovered(hits(event)[0]?.id || null);
    };
    const leave = () => {
      pointer.current = null;
      pointerLabel.current = null;
      setHovered(null);
    };
    canvas.addEventListener("click", click);
    // Listen above the HTML labels as well as the canvas: crossing a title must
    // not look like leaving the universe, or restore the old depth-ranked labels.
    surface.addEventListener("pointermove", move, true);
    surface.addEventListener("pointerleave", leave);
    return () => {
      canvas.removeEventListener("click", click);
      surface.removeEventListener("pointermove", move, true);
      surface.removeEventListener("pointerleave", leave);
    };
  }, [gl, compact, inputRef, onSelect, onNearby, focusing]);
  return (
    <group>
      <points raycast={ignoreRaycast} frustumCulled={false} renderOrder={20}>
        <bufferGeometry key={`${sector.id}:${articles.length}`}>
          <bufferAttribute attach="attributes-aStyle" args={[buffers.styles, 4]} />
          <bufferAttribute attach="attributes-aAccent" args={[buffers.accents, 1]} />
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
          depthTest={false}
          blending={THREE.NormalBlending}
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
            className={`star-label ${pointer.current ? "is-pointer-revealed" : ""} ${item.leavingAt !== null ? "is-leaving" : ""}`}
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
            <span>{TOPICS[item.topic].label}{item.starStyle?.invitation && <em className="star-invitation" title={item.starStyle.invitation}>{item.starStyle.invitation === "다시 발견한 기록" ? "다시 발견" : item.starStyle.invitation}</em>}</span>
            <strong>{item.title}</strong>
            <i aria-hidden="true">↗</i>
          </button>
        </Html>
      ))}
    </group>
  );
}
