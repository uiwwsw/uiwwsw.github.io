import React, {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import ArticleSky from "./ArticleSky";
import AmbientSpace from "./AmbientSpace.jsx";
import { advanceAmbientTime } from "../utils/ambientMotion.js";
import * as THREE from "three";
import { Earth, LunarSurface } from "./CelestialBodies";
import {
  signalFlightPose,
  earthFocusBlend,
  earthFocusFov,
} from "../utils/secretSignal.js";
import { flightPose, earthPosition } from "../utils/observatory";
import { createBackgroundStarData } from "../utils/skyBackdrop.js";
import { createSceneStartup } from "../utils/sceneStartup.js";
import {
  createWorldAssembly,
  stepWorldAssembly,
  worldAssemblyLayout,
} from "../utils/worldAssembly.js";

const starVertex = `
  attribute float aSize;
  attribute float aPhase;
  varying float vPhase;
  varying vec3 vColor;
  varying float vBright;
  uniform float uPixelRatio;
  void main() {
    vPhase = aPhase;
    vColor = color;
    vBright = smoothstep(3.8, 7., aSize);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio;
    gl_Position = projectionMatrix * p;
  }
`;
const starFragment = `
  uniform float uTime;
  uniform float uOpacity;
  varying float vPhase;
  varying vec3 vColor;
  varying float vBright;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float strength = pow(max(0.0, 1.0 - d), 2.5);
    vec2 p = abs(gl_PointCoord - .5) * 2.;
    float rays = (exp(-p.x * 28.) * pow(max(0., 1.-p.y), 3.) + exp(-p.y * 28.) * pow(max(0., 1.-p.x), 3.)) * vBright * .16;
    float shimmer = .72 + .28 * sin(vPhase + uTime * (.48 + .16 * sin(vPhase * 2.)));
    gl_FragColor = vec4(vColor, (strength + rays) * shimmer * uOpacity);
  }
`;
function DeepSky({ paused, focus }) {
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uFocus: { value: 0 } }),
    [],
  );
  useFrame((_, delta) => {
    uniforms.uFocus.value = focus;
    uniforms.uTime.value = advanceAmbientTime(
      uniforms.uTime.value,
      delta,
      paused,
    );
  });
  return (
    <mesh>
      <sphereGeometry args={[480, 32, 20]} />
      <shaderMaterial
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        vertexShader={`
      varying vec3 vDirection;
      void main() { vDirection = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `}
        fragmentShader={`
      varying vec3 vDirection;
      uniform float uTime;
      uniform float uFocus;
      float hash(vec3 p) { p = fract(p * .3183099 + vec3(.1, .2, .3)); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float noise(vec3 x) {
        vec3 p = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
        return mix(mix(mix(hash(p), hash(p+vec3(1,0,0)), f.x), mix(hash(p+vec3(0,1,0)), hash(p+vec3(1,1,0)), f.x), f.y), mix(mix(hash(p+vec3(0,0,1)), hash(p+vec3(1,0,1)), f.x), mix(hash(p+vec3(0,1,1)), hash(p+vec3(1,1,1)), f.x), f.y), f.z);
      }
      float fbm(vec3 p) { float f = 0.; float a = .5; for (int i=0; i<4; i++) { f += noise(p)*a; p = p*2.03+12.3; a *= .5; } return f; }
      void main() {
        vec3 d = normalize(vDirection);
        vec3 flow = vec3(sin(uTime * .027) * .7, uTime * .016, (cos(uTime * .021) - 1.) * .5);
        float cloud = fbm(d * 7. + flow);
        float band = exp(-pow((d.y - d.x * .45 - .1 + cloud * .1) * 5., 2.));
        float dust = smoothstep(.29, .76, fbm(d * 16. + cloud * 4. - flow * .48)) * band;
        float breath = .86 + .14 * sin(uTime * .15 + cloud * 5.);
        vec3 color = vec3(.0118, .0235, .047) + mix(vec3(.052,.09,.15), vec3(.14,.098,.11), cloud) * dust * breath;
        gl_FragColor = vec4(mix(color, vec3(.003, .007, .014), uFocus * .94), 1.);
      }
    `}
      />
    </mesh>
  );
}
function BackgroundStars({ paused, compact, focus }) {
  const { gl } = useThree();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.6) },
    }),
    [gl],
  );
  const data = useMemo(() => createBackgroundStarData(compact), [compact]);
  useFrame((_, delta) => {
    uniforms.uOpacity.value = 1 - focus;
    uniforms.uTime.value = advanceAmbientTime(
      uniforms.uTime.value,
      delta,
      paused,
    );
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
function WorldAssembly({
  assemblyRef,
  ready,
  visible,
  skip,
  progress,
  inputRef,
  onComplete,
  compact,
}) {
  const reported = useRef(false);
  const { size } = useThree();
  const layout = useMemo(
    () => worldAssemblyLayout(compact, size.width / size.height),
    [compact, size.width, size.height],
  );
  useFrame((_, delta) => {
    assemblyRef.current.layout = layout;
    stepWorldAssembly(assemblyRef.current, delta, {
      ready,
      paused: !visible,
      skip,
      interrupted: progress > 0 || inputRef.current.interacted,
    });
    if (assemblyRef.current.phase === "done" && !reported.current) {
      reported.current = true;
      onComplete?.();
    }
  }, -2);
  return null;
}

function CameraRig({
  progress,
  signal,
  selected,
  paused,
  reducedMotion,
  compact,
  inputRef,
  sector,
  earthFocusRef,
  assemblyRef,
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
  useLayoutEffect(() => {
    // Warp between distant regions; never fly through Earth to reach a sector.
    const pose = flightPose(progress, compact);
    camera.position.set(
      ...pose.position.map((value, i) => value + sector.origin[i]),
    );
    look.current.set(
      ...pose.target.map((value, i) => value + sector.origin[i]),
    );
    camera.lookAt(look.current);
  }, [sector.id]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    // During construction the camera has no cinematic offsets or idle drift.
    // User look/travel below remain live; only the world objects slide in.
    drift.current = advanceAmbientTime(
      drift.current,
      dt,
      paused || assemblyRef.current.phase !== "done",
    );
    const focus = earthFocusBlend(signal);
    const pose = signalFlightPose(
      progress,
      signal,
      compact,
      earthFocusRef.current.lengthSq() > 0.5
        ? earthFocusRef.current.toArray()
        : undefined,
    );
    const fov = selected ? (compact ? 58 : 46) : earthFocusFov(signal, compact);
    const nextFov = reducedMotion
      ? fov
      : THREE.MathUtils.damp(camera.fov, fov, 4.5, dt);
    if (Math.abs(camera.fov - nextFov) > 0.00001) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }
    pose.position = pose.position.map((value, i) => value + sector.origin[i]);
    pose.target = pose.target.map((value, i) => value + sector.origin[i]);
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
      const viewScale = 1 - focus;
      targetLook.set(
        pose.target[0] + inputRef.current.lookX * viewScale,
        pose.target[1] +
          (inputRef.current.lookY +
            (paused ? 0 : inputRef.current.travelPitch)) *
            viewScale,
        pose.target[2],
      );
    }
    if (!reducedMotion && !selected) {
      targetPosition.x += Math.sin(drift.current * 0.14) * 0.28 * (1 - focus);
      targetPosition.y += Math.sin(drift.current * 0.21) * 0.16 * (1 - focus);
    }
    const easing = reducedMotion ? 1 : 1 - Math.exp(-dt * 4.5);
    camera.position.lerp(targetPosition, easing);
    // Looking responds faster than travel so the finger never feels tethered.
    look.current.lerp(targetLook, reducedMotion ? 1 : 1 - Math.exp(-dt * 8));
    camera.lookAt(look.current);
  });
  return null;
}
function SceneReady({ assetsReady }) {
  useLayoutEffect(() => {
    assetsReady.current = true;
    return () => {
      assetsReady.current = false;
    };
  }, [assetsReady]);
  return null;
}
function SceneRender({ assetsReady, onReady, onError }) {
  const { gl, scene, camera } = useThree();
  const startup = useRef();
  useEffect(() => {
    const controller = createSceneStartup({
      warm: () => gl.compileAsync(scene, camera),
      render: () => gl.render(scene, camera),
      onReady,
      onError,
    });
    startup.current = controller;
    return () => controller.dispose();
  }, [gl, scene, camera, onReady, onError]);
  // Positive priority owns the render, after camera/uniform updates. Do not
  // force pending GPU programs to draw while compileAsync is still warming.
  useFrame(() => startup.current?.frame(assetsReady.current), 1);
  return null;
}
export default function UniverseScene({
  articles,
  progress,
  signal,
  selected,
  highlighted,
  onSelect,
  paused,
  reducedMotion,
  compact,
  onReady,
  revealed = false,
  onAssemblyComplete,
  skipAssembly = false,
  enhance = false,
  onError,
  inputRef,
  sector,
  onNearby,
  onCloud,
  diagnostics,
  onDiagnostics,
  onAmbientDiagnostics,
  visible = true,
}) {
  const earthFocusRef = useRef(new THREE.Vector3());
  const assetsReady = useRef(false);
  const assemblyRef = useRef(createWorldAssembly(compact));
  const planetPositionRef = useRef(
    new THREE.Vector3(...earthPosition(compact)),
  );
  const focus = earthFocusBlend(signal);
  return (
    <Canvas
      frameloop={visible ? "always" : "never"}
      style={{ touchAction: "none" }}
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
      <WorldAssembly
        compact={compact}
        assemblyRef={assemblyRef}
        ready={revealed}
        onComplete={onAssemblyComplete}
        visible={visible}
        skip={
          reducedMotion ||
          skipAssembly ||
          !!selected ||
          signal > 0 ||
          sector.id !== "home"
        }
        progress={progress}
        inputRef={inputRef}
      />
      <ambientLight intensity={0.12} color="#8a9fca" />
      <directionalLight
        position={[-40, 45, 20]}
        intensity={2.8}
        color="#e2e8f4"
      />
      <group position={sector.origin}>
        <DeepSky paused={paused || !revealed} focus={focus} />
        <BackgroundStars
          paused={paused || !revealed}
          compact={compact}
          focus={focus}
        />
      </group>
      <AmbientSpace
        paused={paused || !revealed}
        compact={compact}
        focus={focus}
        diagnostics={diagnostics}
        onDiagnostics={onAmbientDiagnostics}
      />
      <Suspense fallback={null}>
        <Earth
          signal={signal}
          assemblyRef={assemblyRef}
          planetPositionRef={planetPositionRef}
          paused={paused}
          compact={compact}
          focusRef={earthFocusRef}
          enhance={enhance}
        />
        {sector.id === "home" && (
          <LunarSurface
            assemblyRef={assemblyRef}
            progress={progress}
            reducedMotion={reducedMotion}
            compact={compact}
          />
        )}
        <SceneReady assetsReady={assetsReady} />
      </Suspense>
      <ArticleSky
        planetPositionRef={planetPositionRef}
        paused={paused}
        focus={focus}
        articles={articles}
        progress={progress}
        selected={selected}
        highlighted={highlighted}
        onSelect={onSelect}
        inputRef={inputRef}
        compact={compact}
        sector={sector}
        onNearby={onNearby}
        onCloud={onCloud}
        diagnostics={diagnostics}
        onDiagnostics={onDiagnostics}
      />
      <CameraRig
        assemblyRef={assemblyRef}
        earthFocusRef={earthFocusRef}
        sector={sector}
        progress={progress}
        signal={signal}
        selected={selected}
        paused={paused}
        reducedMotion={reducedMotion}
        compact={compact}
        inputRef={inputRef}
      />
      <SceneRender
        assetsReady={assetsReady}
        onReady={onReady}
        onError={onError}
      />
    </Canvas>
  );
}
