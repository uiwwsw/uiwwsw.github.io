import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  advanceAmbientTime,
  createDustField,
  DUST_BOUNDS,
  distantStreak,
  createStreakSchedule,
} from "../utils/ambientMotion.js";

const ignoreRaycast = () => {};
const dustVertex = `
  attribute vec3 aVelocity;
  attribute float aPhase;
  attribute float aSize;
  attribute float aLayer;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec3 uBounds;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vWarmth;
  void main() {
    vec3 travel = position + aVelocity * uTime;
    travel.y += sin(uTime * .24 + aPhase) * .65;
    // A world-aligned volume follows the observer, wrapping only at its dim
    // outer boundary. Looking around still produces real perspective parallax.
    vec3 bounds = uBounds * mix(1., .48, aLayer);
    vec3 relative = mod(travel - cameraPosition + bounds * .5, bounds) - bounds * .5;
    vec3 p = cameraPosition + relative;
    vec4 view = viewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp(aSize * 85. / max(1., -view.z), 1.2, 5.5) * uPixelRatio;
    float edge = max(max(abs(relative.x / bounds.x), abs(relative.y / bounds.y)), abs(relative.z / bounds.z)) * 2.;
    float nearFade = smoothstep(4., 12., length(relative));
    vAlpha = (1. - smoothstep(.65, 1., edge)) * nearFade * (.46 + aLayer * .1 + .12 * sin(aPhase + uTime * .4)) * uOpacity;
    vWarmth = .5 + .5 * sin(aPhase);
  }
`;
const dustFragment = `
  varying float vAlpha;
  varying float vWarmth;
  void main() {
    float radius = length(gl_PointCoord - .5) * 2.;
    float glow = pow(max(0., 1. - radius), 2.);
    vec3 color = mix(vec3(.52, .77, 1.), vec3(1., .86, .63), vWarmth);
    gl_FragColor = vec4(color, glow * vAlpha);
    #include <colorspace_fragment>
  }
`;

export default React.memo(function AmbientSpace({
  visitSeed = 0,
  paused,
  compact,
  focus = 0,
  diagnostics,
  onDiagnostics,
}) {
  const { gl } = useThree();
  const time = useRef(0);
  const lastReport = useRef(-1);
  const reportTime = useRef(0);
  const streak = useRef();
  const streakAnchor = useRef();
  const field = useMemo(
    () => createDustField(compact, visitSeed),
    [compact, visitSeed],
  );
  const schedule = useMemo(() => createStreakSchedule(visitSeed), [visitSeed]);
  const dustUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uBounds: { value: new THREE.Vector3(...DUST_BOUNDS) },
      uOpacity: { value: 1 },
    }),
    [],
  );
  const streakUniforms = useMemo(() => ({ uOpacity: { value: 0 } }), []);
  useFrame(({ camera }, delta) => {
    time.current = advanceAmbientTime(time.current, delta, paused);
    dustUniforms.uTime.value = time.current;
    dustUniforms.uOpacity.value = 1 - focus;
    dustUniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 1.6);
    const passage = distantStreak(time.current, schedule);
    reportTime.current = advanceAmbientTime(reportTime.current, delta, false);
    if (diagnostics && reportTime.current - lastReport.current > 1) {
      lastReport.current = reportTime.current;
      onDiagnostics?.(
        `ambient ${time.current.toFixed(2)}s · ${paused ? "paused" : "living"} · ${field.sizes.length} dust · trail ${passage.visible ? "visible" : "resting"}`,
      );
    }
    streak.current.visible = passage.visible && focus < 0.99;
    streakUniforms.uOpacity.value = passage.opacity * (1 - focus);
    if (!streak.current.visible) return;
    // A distant, decorative light trail, not another selectable article/star.
    // It stays behind Earth and away from the centered reading/hero text.
    const depth = 175;
    const height =
      2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * depth;
    const width = height * camera.aspect;
    streakAnchor.current.position.copy(camera.position);
    streakAnchor.current.quaternion.copy(camera.quaternion);
    streak.current.position.set(
      schedule.direction * width * (-0.53 + passage.progress * 0.78),
      height * (0.34 - passage.lane * 0.065 - passage.progress * 0.14),
      -depth,
    );
    streak.current.scale.set(width * 0.13, height * 0.0045, 1);
    streak.current.rotation.z = Math.atan2(
      -height * 0.14,
      schedule.direction * width * 0.78,
    );
  });
  return (
    <group>
      <points raycast={ignoreRaycast} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[field.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aVelocity"
            args={[field.velocity, 3]}
          />
          <bufferAttribute
            attach="attributes-aPhase"
            args={[field.phases, 1]}
          />
          <bufferAttribute attach="attributes-aSize" args={[field.sizes, 1]} />
          <bufferAttribute
            attach="attributes-aLayer"
            args={[field.layers, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={dustVertex}
          fragmentShader={dustFragment}
          uniforms={dustUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <group ref={streakAnchor}>
        <mesh
          ref={streak}
          raycast={ignoreRaycast}
          frustumCulled={false}
          visible={false}
        >
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            uniforms={streakUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`}
            fragmentShader={`
              uniform float uOpacity; varying vec2 vUv;
              void main() {
                float core = exp(-pow((vUv.y - .5) * 12., 2.));
                float tail = pow(vUv.x, 2.5) * (1. - smoothstep(.9, 1., vUv.x));
                float head = exp(-pow((vUv.x - .87) * 28., 2.)) * .45;
                gl_FragColor = vec4(mix(vec3(.35,.62,.95), vec3(.85,.94,1.), vUv.x), core * (tail + head) * uOpacity);
                #include <colorspace_fragment>
              }
            `}
          />
        </mesh>
      </group>
    </group>
  );
});
