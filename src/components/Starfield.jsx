import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const STAR_COUNT = 2400;
const STARFIELD_WIDTH = 2400;
const STARFIELD_HEIGHT = 1800;
const STARFIELD_DEPTH = 3200;

function createRng(seed) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStars(count, seed) {
  const rng = createRng(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;

    positions[offset] = (rng() - 0.5) * STARFIELD_WIDTH;
    positions[offset + 1] = (rng() - 0.5) * STARFIELD_HEIGHT;
    positions[offset + 2] = (rng() - 0.5) * STARFIELD_DEPTH;

    const palette = rng();

    if (palette < 0.1) {
      color.set('#ffd7a6');
    } else if (palette < 0.28) {
      color.set('#9bd6ff');
    } else if (palette < 0.44) {
      color.set('#b3fff0');
    } else {
      color.set('#f5f8ff');
    }

    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
  }

  return { positions, colors };
}

export default function Starfield() {
  const geometryRef = useRef();
  const { camera } = useThree();
  const field = useMemo(() => buildStars(STAR_COUNT, 127), []);

  useFrame((state) => {
    const geometry = geometryRef.current;

    if (!geometry) return;

    const positions = geometry.attributes.position.array;
    const halfWidth = STARFIELD_WIDTH / 2;
    const halfHeight = STARFIELD_HEIGHT / 2;
    const halfDepth = STARFIELD_DEPTH / 2;
    const drift = state.clock.elapsedTime * 0.035;
    let changed = false;

    for (let offset = 0; offset < positions.length; offset += 3) {
      const dx = positions[offset] - camera.position.x;
      const dy = positions[offset + 1] - camera.position.y;
      const dz = positions[offset + 2] - camera.position.z;

      if (dx > halfWidth) {
        positions[offset] -= STARFIELD_WIDTH;
        changed = true;
      } else if (dx < -halfWidth) {
        positions[offset] += STARFIELD_WIDTH;
        changed = true;
      }

      if (dy > halfHeight) {
        positions[offset + 1] -= STARFIELD_HEIGHT;
        changed = true;
      } else if (dy < -halfHeight) {
        positions[offset + 1] += STARFIELD_HEIGHT;
        changed = true;
      }

      if (dz > halfDepth) {
        positions[offset + 2] -= STARFIELD_DEPTH;
        positions[offset] += Math.sin(drift + offset * 0.013) * 36;
        positions[offset + 1] += Math.cos(drift + offset * 0.017) * 24;
        changed = true;
      } else if (dz < -halfDepth) {
        positions[offset + 2] += STARFIELD_DEPTH;
        positions[offset] += Math.sin(drift + offset * 0.011) * 36;
        positions[offset + 1] += Math.cos(drift + offset * 0.019) * 24;
        changed = true;
      }
    }

    if (changed) {
      geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={field.positions.length / 3}
          array={field.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={field.colors.length / 3}
          array={field.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={5.2}
        sizeAttenuation
        transparent
        opacity={0.84}
        vertexColors
        depthWrite={false}
      />
    </points>
  );
}
