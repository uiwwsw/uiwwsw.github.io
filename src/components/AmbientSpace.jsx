import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  advanceAmbientTime,
  createDustField,
  DUST_BOUNDS,
  distantStreak,
} from "../utils/ambientMotion.js";

const ignoreRaycast = () => {};
const dustVertex = `
  attribute vec3 aVelocity;
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec3 uBounds;
  varying float vAlpha;
  varying float vWarmth;
  void main() {
    vec3 travel = position + aVelocity * uTime;
    travel.y += sin(uTime * .14 + aPhase) * .45;
    // A world-aligned volume follows the observer, wrapping only at its dim
    // outer boundary. Looking around still produces real perspective parallax.
    vec3 relative = mod(travel - cameraPosition + uBounds * .5, uBounds) - uBounds * .5;
    vec3 p = cameraPosition + relative;
    vec4 view = viewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp(aSize * 85. / max(1., -view.z), 1.2, 7.) * uPixelRatio;
    float edge = max(max(abs(relative.x / uBounds.x), abs(relative.y / uBounds.y)), abs(relative.z / uBounds.z)) * 2.;
    float nearFade = smoothstep(4., 12., length(relative));
    vAlpha = (1. - smoothstep(.65, 1., edge)) * nearFade * (.42 + .14 * sin(aPhase + uTime * .28));
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

export default function AmbientSpace({
  paused,
  compact,
  diagnostics,
  onDiagnostics,
}) {
  const { gl } = useThree();
  const time = useRef(0);
  const lastReport = useRef(-1);
  const streak = useRef();
  const streakAnchor = useRef();
  const field = useMemo(() => createDustField(compact), [compact]);
  const dustUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uBounds: { value: new THREE.Vector3(...DUST_BOUNDS) },
    }),
    [],
  );
  const streakUniforms = useMemo(() => ({ uOpacity: { value: 0 } }), []);
  useFrame(({ camera, clock }, delta) => {
    time.current = advanceAmbientTime(time.current, delta, paused);
    dustUniforms.uTime.value = time.current;
    dustUniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 1.6);
    const passage = distantStreak(time.current);
    if (diagnostics && clock.elapsedTime - lastReport.current > 1) {
      lastReport.current = clock.elapsedTime;
      onDiagnostics?.(
        `ambient ${time.current.toFixed(2)}s · ${paused ? "paused" : "living"} · ${field.sizes.length} dust · trail ${passage.visible ? "visible" : "resting"}`,
      );
    }
    streak.current.visible = passage.visible;
    streakUniforms.uOpacity.value = passage.opacity;
    if (!passage.visible) return;
    // A distant, decorative light trail, not another selectable article/star.
    // It stays behind Earth and away from the centered reading/hero text.
    const depth = 175;
    const height =
      2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * depth;
    const width = height * camera.aspect;
    streakAnchor.current.position.copy(camera.position);
    streakAnchor.current.quaternion.copy(camera.quaternion);
    streak.current.position.set(
      width * (-0.53 + passage.progress * 0.78),
      height * (0.34 - passage.lane * 0.065 - passage.progress * 0.14),
      -depth,
    );
    streak.current.scale.set(width * 0.13, height * 0.0045, 1);
    streak.current.rotation.z = Math.atan2(-height * 0.14, width * 0.78);
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
                gl_FragColor = vec4(mix(vec3(.35,.62,.95), vec3(.85,.94,1.), vUv.x), core * tail * uOpacity);
                #include <colorspace_fragment>
              }
            `}
          />
        </mesh>
      </group>
    </group>
  );
}
