import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Earth, LunarSurface } from "./CelestialBodies";
import {
  clamp,
  flightPose,
  seededRandom,
  TOPICS,
  earthPosition,
  EARTH_RADIUS,
} from "../utils/observatory";

const starVertex = `
  attribute float aSize;
  attribute float aPhase;
  varying float vPhase;
  varying vec3 vColor;
  uniform float uPixelRatio;
  void main() {
    vPhase = aPhase;
    vColor = color;
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio;
    gl_Position = projectionMatrix * p;
  }
`;
const starFragment = `
  uniform float uTime;
  varying float vPhase;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float strength = pow(max(0.0, 1.0 - d), 2.5);
    gl_FragColor = vec4(vColor, strength * (0.68 + 0.32 * sin(vPhase + uTime * 0.35)));
  }
`;
function DeepSky() {
  return (
    <mesh>
      <sphereGeometry args={[480, 32, 20]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        vertexShader={`
      varying vec3 vDirection;
      void main() { vDirection = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `}
        fragmentShader={`
      varying vec3 vDirection;
      float hash(vec3 p) { p = fract(p * .3183099 + vec3(.1, .2, .3)); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float noise(vec3 x) {
        vec3 p = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
        return mix(mix(mix(hash(p), hash(p+vec3(1,0,0)), f.x), mix(hash(p+vec3(0,1,0)), hash(p+vec3(1,1,0)), f.x), f.y), mix(mix(hash(p+vec3(0,0,1)), hash(p+vec3(1,0,1)), f.x), mix(hash(p+vec3(0,1,1)), hash(p+vec3(1,1,1)), f.x), f.y), f.z);
      }
      float fbm(vec3 p) { float f = 0.; float a = .5; for (int i=0; i<4; i++) { f += noise(p)*a; p = p*2.03+12.3; a *= .5; } return f; }
      void main() {
        vec3 d = normalize(vDirection);
        float cloud = fbm(d * 7.);
        float band = exp(-pow((d.y - d.x * .45 - .1 + cloud * .1) * 5., 2.));
        float dust = smoothstep(.29, .76, fbm(d * 16. + cloud * 4.)) * band;
        vec3 color = vec3(.0118, .0235, .047) + mix(vec3(.047,.068,.105), vec3(.095,.076,.073), cloud) * dust;
        gl_FragColor = vec4(color, 1.);
      }
    `}
      />
    </mesh>
  );
}
function BackgroundStars({ paused, compact }) {
  const { gl } = useThree();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.6) },
    }),
    [gl],
  );
  const data = useMemo(() => {
    const random = seededRandom(20260907);
    const count = compact ? 2800 : 6000;
    const positions = [],
      colors = [],
      sizes = [],
      phases = [];
    for (let i = 0; i < count; i++) {
      const azimuth = random() * Math.PI * 2;
      const latitude =
        i < count * 0.65
          ? (random() - 0.5) * 0.22
          : Math.asin(random() * 2 - 1);
      const radius = 200 + random() * 180;
      const x = Math.cos(azimuth) * Math.cos(latitude) * radius;
      const y = Math.sin(latitude) * radius;
      positions.push(
        x,
        y + x * 0.45 + 40,
        Math.sin(azimuth) * Math.cos(latitude) * radius,
      );
      const warmth = random();
      colors.push(
        0.67 + warmth * 0.3,
        0.73 + warmth * 0.17,
        0.9 - warmth * 0.15,
      );
      sizes.push(random() < 0.025 ? 4 + random() * 3 : 0.7 + random() * 2.1);
      phases.push(random() * 6.28);
    }
    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      sizes: new Float32Array(sizes),
      phases: new Float32Array(phases),
    };
  }, [compact]);
  useFrame((_, delta) => {
    if (!paused) uniforms.uTime.value += Math.min(delta, 0.05);
  });
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={data.positions}
          count={data.positions.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={data.colors}
          count={data.colors.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          array={data.sizes}
          count={data.sizes.length}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          array={data.phases}
          count={data.phases.length}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={starVertex}
        fragmentShader={starFragment}
        uniforms={uniforms}
        transparent
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
function CameraRig({
  progress,
  selected,
  paused,
  reducedMotion,
  compact,
  inputRef,
}) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(...flightPose(0, compact).target));
  const drift = useRef(0);
  useEffect(() => {
    camera.fov = compact ? 58 : 46;
    camera.updateProjectionMatrix();
  }, [camera, compact]);
  const targetPosition = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!paused) drift.current += dt;
    const pose = flightPose(progress, compact);
    if (selected) {
      targetPosition.set(
        selected.position[0] + (compact ? 0 : 4),
        selected.position[1] + 1,
        selected.position[2] + 13,
      );
      targetLook.set(
        selected.position[0] + (compact ? 0 : 4),
        selected.position[1],
        selected.position[2],
      );
    } else {
      targetPosition.set(...pose.position);
      targetLook.set(
        pose.target[0] + inputRef.current.lookX,
        pose.target[1] + inputRef.current.lookY,
        pose.target[2],
      );
    }
    if (!paused && !selected) {
      targetPosition.x += Math.sin(drift.current * 0.14) * 0.28;
      targetPosition.y += Math.sin(drift.current * 0.21) * 0.16;
    }
    const easing = reducedMotion ? 1 : 1 - Math.exp(-dt * 2.2);
    camera.position.lerp(targetPosition, easing);
    look.current.lerp(targetLook, easing);
    camera.lookAt(look.current);
  });
  return null;
}
function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.065, "rgba(255,255,255,1)");
  gradient.addColorStop(0.14, "rgba(255,255,255,0.4)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.08)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}
function ArticleStar({
  article,
  glow,
  visible,
  dimmed,
  selected,
  onSelect,
  inputRef,
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={article.position}>
      <sprite scale={selected || hovered ? [2, 2, 2] : [1.15, 1.15, 1.15]}>
        <spriteMaterial
          map={glow}
          color={article.color}
          transparent
          opacity={dimmed ? 0.12 : 0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <mesh
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(event) => {
          event.stopPropagation();
          if (!inputRef.current.dragged && !dimmed) onSelect(article);
        }}
      >
        <sphereGeometry args={[0.38, 8, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {((visible && !dimmed) || hovered || selected) && (
        <Html
          position={[0.5, 0.05, 0]}
          zIndexRange={[8, 1]}
          style={{ pointerEvents: "auto" }}
        >
          <button
            className={`star-label ${selected ? "is-selected" : ""}`}
            style={{ "--star-color": article.color }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onSelect(article)}
          >
            <span>{TOPICS[article.topic].english}</span>
            <strong>{article.title}</strong>
            <i aria-hidden="true">↗</i>
          </button>
        </Html>
      )}
    </group>
  );
}
function ArticleSky({
  articles,
  progress,
  selected,
  highlighted,
  onSelect,
  inputRef,
  compact,
}) {
  const { size } = useThree();
  const glow = useMemo(createGlowTexture, []);
  const [visible, setVisible] = useState([]);
  const lastCheck = useRef(0);
  const vector = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => () => glow.dispose(), [glow]);
  useFrame(({ camera, clock }) => {
    if (clock.elapsedTime - lastCheck.current < 0.35) return;
    lastCheck.current = clock.elapsedTime;
    const planet = new THREE.Vector3(...earthPosition(compact));
    const planetDistance = planet.distanceTo(camera.position);
    planet.project(camera);
    const planetX = ((planet.x + 1) * size.width) / 2;
    const planetY = ((1 - planet.y) * size.height) / 2;
    const planetRadius =
      (((EARTH_RADIUS * 1.03) / planetDistance) * size.height) /
      (2 * Math.tan((camera.fov * Math.PI) / 360));
    const labelWidth = compact ? 156 : 198;
    const labelHeight = compact ? 72 : 82;
    const candidates =
      progress > 0.12 && !selected
        ? articles
            .map((article) => {
              vector.set(...article.position);
              const distance = vector.distanceTo(camera.position);
              vector.project(camera);
              const x = ((vector.x + 1) * size.width) / 2 + 10;
              const y = ((1 - vector.y) * size.height) / 2;
              const overlapsPlanet =
                Math.hypot(
                  clamp(planetX, x, x + labelWidth) - planetX,
                  clamp(planetY, y, y + labelHeight) - planetY,
                ) <
                planetRadius + 16;
              const overlapsHeading =
                x < (compact ? size.width : 490) &&
                y < size.height * (compact ? 0.38 : 0.42);
              return {
                id: article.id,
                distance,
                x,
                y,
                visible:
                  vector.z < 1 &&
                  vector.z > -1 &&
                  x > size.width * 0.06 &&
                  x + labelWidth < size.width * 0.93 &&
                  y > size.height * 0.2 &&
                  y + labelHeight < size.height - (compact ? 185 : 160) &&
                  !overlapsPlanet &&
                  !overlapsHeading &&
                  (!highlighted || highlighted.has(article.id)),
              };
            })
            .filter((item) => item.visible && item.distance < 75)
            .sort((a, b) => a.distance - b.distance)
        : [];
    const kept = [];
    for (const candidate of candidates) {
      if (
        !kept.some(
          (other) =>
            Math.abs(other.x - candidate.x) < labelWidth + 14 &&
            Math.abs(other.y - candidate.y) < labelHeight + 12,
        )
      )
        kept.push(candidate);
      if (kept.length >= (compact ? 3 : 5)) break;
    }
    const nearest = kept.map((item) => item.id);
    setVisible((previous) =>
      previous.join() === nearest.join() ? previous : nearest,
    );
  });
  const lines = useMemo(() => {
    const points = [];
    for (const topic of Object.keys(TOPICS)) {
      const group = articles.filter((article) => article.topic === topic);
      group.slice(0, -1).forEach((article, index) => {
        const next = group[index + 1];
        if (
          Math.hypot(...article.position.map((v, i) => v - next.position[i])) <
          22
        )
          points.push(...article.position, ...next.position);
      });
    }
    return new Float32Array(points);
  }, [articles]);
  return (
    <group>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={lines}
            count={lines.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#aac9db"
          transparent
          opacity={progress > 0.15 ? 0.13 : 0.035}
          depthWrite={false}
        />
      </lineSegments>
      {articles.map((article) => (
        <ArticleStar
          key={article.id}
          article={article}
          glow={glow}
          visible={visible.includes(article.id)}
          dimmed={highlighted && !highlighted.has(article.id)}
          selected={selected?.id === article.id}
          onSelect={onSelect}
          inputRef={inputRef}
        />
      ))}
    </group>
  );
}
function SceneReady({ onReady }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}
export default function UniverseScene({
  articles,
  progress,
  selected,
  highlighted,
  onSelect,
  paused,
  reducedMotion,
  compact,
  onReady,
  onError,
  inputRef,
}) {
  return (
    <Canvas
      style={{ touchAction: "pinch-zoom" }}
      camera={{
        position: flightPose(0, compact).position,
        fov: compact ? 58 : 46,
        near: 0.1,
        far: 650,
      }}
      dpr={compact ? [1, 1.25] : [1, 1.6]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor("#03060c");
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        camera.lookAt(...flightPose(0, compact).target);
        gl.domElement.addEventListener(
          "webglcontextlost",
          (event) => {
            event.preventDefault();
            onError();
          },
          { once: true },
        );
      }}
    >
      <ambientLight intensity={0.12} color="#8a9fca" />
      <directionalLight
        position={[-40, 45, 20]}
        intensity={2.8}
        color="#e2e8f4"
      />
      <DeepSky />
      <BackgroundStars paused={paused} compact={compact} />
      <Suspense fallback={null}>
        <Earth paused={paused} compact={compact} />
        <LunarSurface progress={progress} reducedMotion={reducedMotion} />
        <SceneReady onReady={onReady} />
      </Suspense>
      <ArticleSky
        articles={articles}
        progress={progress}
        selected={selected}
        highlighted={highlighted}
        onSelect={onSelect}
        inputRef={inputRef}
        compact={compact}
      />
      <CameraRig
        progress={progress}
        selected={selected}
        paused={paused}
        reducedMotion={reducedMotion}
        compact={compact}
        inputRef={inputRef}
      />
    </Canvas>
  );
}
