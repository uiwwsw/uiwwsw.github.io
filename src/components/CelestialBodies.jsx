import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  earthOrientation,
  earthSway,
  EARTH_FOCUS,
  geographicSurfacePoint,
} from "../utils/earthOrientation";
import { advanceAmbientTime } from "../utils/ambientMotion.js";
import { SCENE_TEXTURES } from "../utils/sceneStartup.js";
import { SceneBoundary } from "./Interface";
import {
  CLOUD_OPACITY,
  CLOUD_SHELL_SCALE,
  CLOUD_SHADOW_STRENGTH,
  cloudSampling,
  configureEarthTextures,
  earthCloudOffset,
} from "../utils/earthLayers.js";
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
  uniform float nightStrength;
  uniform float cloudShadowStrength;
  ${cloudSampling}
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 n = normalize(vNormal);
    float light = dot(n, normalize(vec3(-0.95, 0.45, 0.45)));
    float day = smoothstep(-0.16, 0.26, light);
    vec3 ground = pow(texture2D(dayMap, vUv).rgb, vec3(2.2));
    vec3 night = pow(texture2D(nightMap, vUv).rgb, vec3(2.2));
    // Terrain never drifts or receives a second pale color map. Only a faint,
    // closely aligned shadow comes from the physically separate cloud shell.
    float shadow = cloudDensity(vUv, vec2(.0007, .0004));
    ground *= 1.0 - shadow * cloudShadowStrength;
    ground = mix(ground, vec3(dot(ground, vec3(0.2126, 0.7152, 0.0722))), 0.12);
    vec3 color = ground * (max(light, 0.0) * 1.7 + 0.035) * day;
    color += night * (1.0 - day) * vec3(1.7, 1.25, 0.8) * nightStrength;
    float fresnel = pow(1.0 - max(dot(n, normalize(cameraPosition - vPosition)), 0.0), 3.2);
    vec3 atmosphere = mix(vec3(0.55, 0.18, 0.075), vec3(0.16, 0.5, 1.0), smoothstep(-0.2, 0.6, light));
    color += atmosphere * fresnel * smoothstep(-0.35, 0.6, light) * 0.8;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const cloudFragment = `
  ${cloudSampling}
  uniform float cloudOpacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 n = normalize(vNormal);
    float light = dot(n, normalize(vec3(-0.95, 0.45, 0.45)));
    float daylight = smoothstep(-0.18, 0.32, light);
    float facing = max(dot(n, normalize(cameraPosition - vPosition)), 0.0);
    float alpha = cloudDensity(vUv, vec2(0.0)) * cloudOpacity * daylight * smoothstep(0.0, 0.22, facing);
    if (alpha < 0.002) discard;
    vec3 color = vec3(.76, .84, .93) * (max(light, 0.0) * 1.2 + .12);
    gl_FragColor = vec4(color, alpha);
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
const ignoreOptionalTextureError = () => {};
function EarthDetails({ uniforms, detailsReady }) {
  const [night, surface] = useTexture(
    [SCENE_TEXTURES.night, SCENE_TEXTURES.clouds],
    configureEarthTextures,
  );
  useEffect(() => {
    uniforms.nightMap.value = night;
    uniforms.surfaceMap.value = surface;
    detailsReady.current = true;
    return () => {
      detailsReady.current = false;
    };
  }, [night, surface, uniforms, detailsReady]);
  return null;
}

export function Earth({ paused, compact, focusRef, enhance }) {
  const globe = useRef();
  const orientation = useMemo(() => earthOrientation(compact), [compact]);
  const korea = useMemo(
    () => geographicSurfacePoint(EARTH_FOCUS.latitude, EARTH_FOCUS.longitude),
    [],
  );
  const north = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const [day] = useTexture([SCENE_TEXTURES.day], configureEarthTextures);
  const uniforms = useMemo(
    () => ({
      dayMap: { value: day },
      // Valid same-type placeholders keep one stable shader program. Optional
      // maps are masked out, never painted as a second geographic surface.
      nightMap: { value: day },
      surfaceMap: { value: day },
      nightStrength: { value: 0 },
      cloudOffset: { value: 0 },
      cloudOpacity: { value: 0 },
      cloudShadowStrength: { value: 0 },
      time: { value: 0 },
    }),
    [day],
  );
  const detailsReady = useRef(false);
  const detailMix = useRef(0);
  useFrame((_, delta) => {
    const target = detailsReady.current ? 1 : 0;
    detailMix.current = paused
      ? target
      : THREE.MathUtils.damp(
          detailMix.current,
          target,
          2.8,
          Math.min(delta, 0.05),
        );
    uniforms.nightStrength.value = detailMix.current;
    uniforms.cloudOpacity.value = CLOUD_OPACITY * detailMix.current;
    uniforms.cloudShadowStrength.value =
      CLOUD_SHADOW_STRENGTH * detailMix.current;
    if (!paused) {
      uniforms.time.value = advanceAmbientTime(
        uniforms.time.value,
        delta,
        paused,
      );
      globe.current.rotation.y = earthSway(uniforms.time.value);
      uniforms.cloudOffset.value = earthCloudOffset(uniforms.time.value);
    }
    // Share the exact texture orientation with the focus camera; no React
    // state updates, second globe, UV offset or independent rotation clock.
    focusRef.current
      .copy(korea)
      .applyAxisAngle(north, globe.current.rotation.y)
      .applyQuaternion(orientation);
  });
  return (
    <group position={earthPosition(compact)} quaternion={orientation}>
      {enhance && (
        <SceneBoundary onError={ignoreOptionalTextureError}>
          <Suspense fallback={null}>
            <EarthDetails uniforms={uniforms} detailsReady={detailsReady} />
          </Suspense>
        </SceneBoundary>
      )}
      <group ref={globe}>
        <mesh
          name="earth-surface"
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
        <mesh name="earth-clouds" scale={CLOUD_SHELL_SCALE} raycast={() => {}}>
          <sphereGeometry args={[EARTH_RADIUS, 96, 64]} />
          <shaderMaterial
            vertexShader={planetVertex}
            fragmentShader={cloudFragment}
            uniforms={uniforms}
            transparent
            side={THREE.FrontSide}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
            blending={THREE.NormalBlending}
          />
        </mesh>
        <mesh name="earth-atmosphere" scale={1.025} raycast={() => {}}>
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
  const map = useTexture(SCENE_TEXTURES.moon);
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
