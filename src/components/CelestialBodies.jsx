import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { earthOrientation, earthSway } from "../utils/earthOrientation";
import { advanceAmbientTime } from "../utils/ambientMotion.js";
import {
  seededRandom,
  earthPosition,
  EARTH_RADIUS,
} from "../utils/observatory";

const planetVertex = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const earthFragment = `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D surfaceMap;
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 n = normalize(vNormal);
    float light = dot(n, normalize(vec3(-0.95, 0.45, 0.45)));
    float day = smoothstep(-0.16, 0.26, light);
    vec3 ground = pow(texture2D(dayMap, vUv).rgb, vec3(2.2));
    vec3 night = pow(texture2D(nightMap, vUv).rgb, vec3(2.2));
    vec2 cloudUv = vec2(fract(vUv.x + time * 0.0018), vUv.y);
    float cloud = smoothstep(0.32, 0.95, texture2D(surfaceMap, cloudUv).b);
    float shadow = smoothstep(.32, .95, texture2D(surfaceMap, cloudUv + vec2(.004, .0015)).b);
    ground *= 1.0 - shadow * .15;
    ground = mix(ground, vec3(dot(ground, vec3(0.2126, 0.7152, 0.0722))), 0.12);
    ground = mix(ground, vec3(0.86, 0.91, 1.0), cloud * 0.88);
    vec3 color = ground * (max(light, 0.0) * 1.7 + 0.035) * day;
    color += night * (1.0 - day) * vec3(1.7, 1.25, 0.8);
    float fresnel = pow(1.0 - max(dot(n, normalize(cameraPosition - vPosition)), 0.0), 3.2);
    vec3 atmosphere = mix(vec3(0.55, 0.18, 0.075), vec3(0.16, 0.5, 1.0), smoothstep(-0.2, 0.6, light));
    color += atmosphere * fresnel * smoothstep(-0.35, 0.6, light) * 0.8;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const atmosphereFragment = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 n = normalize(vNormal);
    float facing = abs(dot(n, normalize(cameraPosition - vPosition)));
    float rim = pow(1.0 - facing, 4.0);
    float sunlight = smoothstep(-0.45, 0.7, dot(n, normalize(vec3(-0.95, 0.45, 0.45))));
    float breath = .94 + .06 * sin(time * .19 + n.y * 3.);
    float polarBand = exp(-pow((abs(vUv.y - .5) - .34) * 25., 2.));
    float curtain = pow(.5 + .5 * sin(vUv.x * 65. + time * .23 + sin(vUv.x * 21. - time * .12) * 2.), 3.);
    float aurora = polarBand * curtain * (1. - sunlight) * .16;
    gl_FragColor = vec4(mix(vec3(.18,.48,1.), vec3(.26,.92,.77), aurora * 3.), rim * (sunlight * .6 * breath + aurora));
    #include <colorspace_fragment>
  }
`;
export function Earth({ paused, compact }) {
  const globe = useRef();
  const orientation = useMemo(() => earthOrientation(compact), [compact]);
  const [day, night, surface] = useTexture([
    "/textures/earth-day.jpg",
    "/textures/earth-night.jpg",
    "/textures/earth-surface.jpg",
  ]);
  const uniforms = useMemo(
    () => ({
      dayMap: { value: day },
      nightMap: { value: night },
      surfaceMap: { value: surface },
      time: { value: 0 },
    }),
    [day, night, surface],
  );
  useFrame((_, delta) => {
    if (!paused) {
      uniforms.time.value = advanceAmbientTime(
        uniforms.time.value,
        delta,
        paused,
      );
      globe.current.rotation.y = earthSway(uniforms.time.value);
    }
  });
  return (
    <group position={earthPosition(compact)} quaternion={orientation}>
      <mesh
        ref={globe}
        onPointerOver={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <sphereGeometry args={[EARTH_RADIUS, 96, 64]} />
        <shaderMaterial
          vertexShader={planetVertex}
          fragmentShader={earthFragment}
          uniforms={uniforms}
        />
      </mesh>
      <mesh scale={1.025}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 48]} />
        <shaderMaterial
          vertexShader={planetVertex}
          fragmentShader={atmosphereFragment}
          uniforms={uniforms}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
function terrainHeight(x, z, craters) {
  let h =
    Math.sin(x * 0.08 + z * 0.03) * 1.5 + Math.cos(z * 0.13 - x * 0.04) * 1.1;
  h +=
    Math.sin(x * 0.27 + z * 0.22) * 0.34 + Math.sin(x * 0.9 - z * 0.6) * 0.12;
  for (const crater of craters) {
    const d = Math.hypot(x - crater.x, z - crater.z) / crater.radius;
    if (d < 1.5)
      h +=
        (-Math.exp(-d * d * 3.8) * 0.42 +
          Math.exp(-Math.pow((d - 0.92) * 5.5, 2)) * 0.2) *
        crater.radius;
  }
  return h - 10;
}
export function LunarSurface({ progress, reducedMotion }) {
  const group = useRef();
  useFrame((_, delta) => {
    const target = -Math.pow(progress, 1.3) * 40;
    group.current.position.y = reducedMotion
      ? target
      : THREE.MathUtils.damp(
          group.current.position.y,
          target,
          2.2,
          Math.min(delta, 0.05),
        );
  });
  const map = useTexture("/textures/moon.jpg");
  const { geometry, craters } = useMemo(() => {
    const random = seededRandom(1997);
    const craters = Array.from({ length: 48 }, () => ({
      x: (random() - 0.5) * 200,
      z: random() * 170 - 72,
      radius: 3 + random() * 12,
    }));
    const geometry = new THREE.PlaneGeometry(260, 220, 220, 180);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0, 30);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++)
      positions.setY(
        i,
        terrainHeight(positions.getX(i), positions.getZ(i), craters),
      );
    geometry.computeVertexNormals();
    return { geometry, craters };
  }, []);
  const lunarMap = useMemo(() => {
    const texture = map.clone();
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(9, 8);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [map]);
  const rocks = useRef();
  React.useLayoutEffect(() => {
    const random = seededRandom(42);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 180; i++) {
      const x = (random() - 0.5) * 120;
      const z = random() * 120 - 50;
      const scale = 0.12 + Math.pow(random(), 3) * 1.3;
      dummy.position.set(x, terrainHeight(x, z, craters) + scale * 0.2, z);
      dummy.scale.set(scale * 1.4, scale * 0.65, scale);
      dummy.rotation.set(random(), random() * 6, random());
      dummy.updateMatrix();
      rocks.current.setMatrixAt(i, dummy.matrix);
    }
    rocks.current.instanceMatrix.needsUpdate = true;
  }, [craters]);
  React.useEffect(
    () => () => {
      geometry.dispose();
      lunarMap.dispose();
    },
    [geometry, lunarMap],
  );
  return (
    <group ref={group}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={lunarMap}
          color="#858a98"
          roughness={1}
          bumpMap={lunarMap}
          bumpScale={0.65}
        />
      </mesh>
      <instancedMesh ref={rocks} args={[undefined, undefined, 180]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#545965" roughness={1} />
      </instancedMesh>
    </group>
  );
}
