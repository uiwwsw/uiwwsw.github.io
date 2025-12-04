import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles, Float, Text, ContactShadows, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const NeonSign = ({ position }) => {
  const glow = new THREE.Color('#7c3aed');
  const neon = new THREE.Color('#a855f7');
  return (
    <Float speed={1.2} rotationIntensity={0.35} floatIntensity={0.6} position={position}>
      <group>
        <Text
          fontSize={0.32}
          color={neon}
          position={[0, 0.1, 0]}
          letterSpacing={0.02}
          material-toneMapped={false}
        >
          uiwwsw
          <meshBasicMaterial color={neon} />
        </Text>
        <Text
          fontSize={0.18}
          color={glow}
          position={[0, -0.18, 0]}
          letterSpacing={0.04}
          material-toneMapped={false}
        >
          Frontend Developer
          <meshBasicMaterial color={glow} />
        </Text>
      </group>
    </Float>
  );
};

const DeskSet = () => {
  const monitorRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (monitorRef.current) {
      monitorRef.current.emissiveIntensity = 1.4 + Math.sin(t * 2) * 0.2;
    }
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[2.4, 0.1, 1.1]} />
        <meshStandardMaterial color="#111827" metalness={0.2} roughness={0.4} />
      </mesh>
      {[-1, 1].map((x) => (
        <mesh key={x} position={[x, 0.18, -0.45]}>
          <boxGeometry args={[0.12, 0.36, 0.12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.18, 0.45]}>
        <boxGeometry args={[0.12, 0.36, 0.12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      <group position={[0, 0.78, -0.15]}>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.8, 0.5, 0.05]} />
          <meshStandardMaterial color="#0b1220" metalness={0.1} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.38, -0.12]}>
          <boxGeometry args={[0.7, 0.05, 0.25]} />
          <meshStandardMaterial color="#0a162b" metalness={0.2} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.35, 0.12]}>
          <boxGeometry args={[0.7, 0.4, 0.01]} />
          <meshStandardMaterial
            ref={monitorRef}
            color="#6ee7ff"
            emissive="#7c3aed"
            emissiveIntensity={1.4}
            toneMapped={false}
          />
        </mesh>
      </group>

      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.12, 32]} />
        <meshStandardMaterial color="#0b1220" metalness={0.15} roughness={0.45} />
      </mesh>

      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.6, 32]} />
        <meshStandardMaterial color="#1f2937" metalness={0.1} roughness={0.55} />
      </mesh>

      <mesh position={[0.7, 0.42, 0.15]} rotation={[0, Math.PI / 6, 0]}>
        <boxGeometry args={[0.6, 0.14, 0.35]} />
        <meshStandardMaterial color="#111827" metalness={0.1} roughness={0.5} />
      </mesh>

      <mesh position={[-0.65, 0.42, 0.15]} rotation={[0, -Math.PI / 8, 0]}>
        <boxGeometry args={[0.55, 0.16, 0.28]} />
        <meshStandardMaterial color="#0f172a" metalness={0.12} roughness={0.55} />
      </mesh>

      <mesh position={[0.2, 0.42, 0.15]} rotation={[0, Math.PI / 12, 0]}>
        <boxGeometry args={[0.3, 0.08, 0.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.08} roughness={0.6} />
      </mesh>
    </group>
  );
};

const HoverRig = ({ children }) => {
  const rigRef = useRef();
  const { camera } = useThree();

  useFrame(({ pointer }) => {
    const targetX = pointer.y * 0.25;
    const targetY = pointer.x * 0.5;

    if (rigRef.current) {
      rigRef.current.rotation.x = THREE.MathUtils.lerp(rigRef.current.rotation.x, targetX, 0.08);
      rigRef.current.rotation.y = THREE.MathUtils.lerp(rigRef.current.rotation.y, targetY, 0.08);
    }

    camera.lookAt(0, 0.6, 0);
  });

  return (
    <group ref={rigRef} position={[0, -0.15, 0]}>
      {children}
    </group>
  );
};

const DataVeil = () => {
  const pointsRef = useRef();
  const materialRef = useRef();
  const count = 1500;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3] = (Math.random() - 0.5) * 6;
      arr[i3 + 1] = Math.random() * 3 - 1.2;
      arr[i3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, [count]);

  const shifts = useMemo(() => {
    const arr = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const i4 = i * 4;
      arr[i4] = Math.random() * Math.PI * 2;
      arr[i4 + 1] = Math.random() * Math.PI * 2;
      arr[i4 + 2] = Math.random() * Math.PI * 2;
      arr[i4 + 3] = Math.random();
    }
    return arr;
  }, [count]);

  const pointer2D = useRef(new THREE.Vector2());

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
      pointer2D.current.set(pointer.x * 2.6, pointer.y * 2.2);
      materialRef.current.uniforms.uPointer.value.copy(pointer2D.current);
    }
  });

  return (
    <points ref={pointsRef} position={[0, 0.25, 0]} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-shift" array={shifts} count={count} itemSize={4} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2() },
        }}
        vertexShader={`
          uniform float uTime;
          uniform vec2 uPointer;
          attribute vec4 shift;
          varying float vAlpha;
          varying vec3 vColor;

          void main() {
            vec3 p = position;
            float t = uTime * 0.6;
            p.x += sin(t * 0.6 + shift.x) * 0.45;
            p.y += sin(t + shift.y) * 0.35 + shift.w * 0.4;
            p.z += cos(t * 0.8 + shift.z) * 0.5;

            float pull = 1.0 - smoothstep(0.3, 2.0, length(uPointer - p.xy));
            p.xy += (uPointer - p.xy) * pull * 0.2;

            vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            float size = (1.6 + sin(uTime + shift.w * 6.0)) * (120.0 / -mvPosition.z);
            gl_PointSize = size;

            float tint = clamp(0.2 + p.y * 0.35, 0.0, 1.0);
            vColor = mix(vec3(0.41, 0.28, 0.91), vec3(0.2, 0.86, 0.97), tint);
            vAlpha = mix(0.2, 0.7, pull);
          }
        `}
        fragmentShader={`
          varying float vAlpha;
          varying vec3 vColor;

          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            float alpha = smoothstep(0.6, 0.18, d) * vAlpha;
            gl_FragColor = vec4(vColor, alpha);
          }
        `}
      />
    </points>
  );
};

const Scene = () => {
  const sparkColor = useMemo(() => new THREE.Color('#7c3aed'), []);
  const sparkColor2 = useMemo(() => new THREE.Color('#a855f7'), []);
  return (
    <Canvas camera={{ position: [2.6, 1.9, 2.6], fov: 45 }} shadows>
      <color attach="background" args={[0x050811]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 6, 3]} intensity={30} color="#7c3aed" />
      <spotLight
        position={[-5, 8, -5]}
        angle={0.5}
        penumbra={0.5}
        intensity={18}
        color="#8b5cf6"
        castShadow
      />

      <HoverRig>
        <DeskSet />
        <NeonSign position={[0, 1.4, 0]} />

        <group position={[0, 0.3, 0]}>
          <DataVeil />
        </group>

        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.35}
          scale={5}
          blur={1.8}
          far={2.4}
          color="#111827"
        />
      </HoverRig>

      <Sparkles count={70} speed={0.24} opacity={0.26} color={sparkColor} scale={5} size={3.2} />
      <Sparkles count={70} speed={0.2} opacity={0.2} color={sparkColor2} scale={5} size={3.2} />

      <Environment preset="night" background>
        <mesh>
          <sphereGeometry args={[20, 32, 32]} />
          <meshBasicMaterial color="#050811" side={THREE.BackSide} />
        </mesh>
      </Environment>

      <EffectComposer>
        <Bloom mipmapBlur intensity={1.0} luminanceThreshold={0.28} radius={0.65} />
      </EffectComposer>
    </Canvas>
  );
};

export default function App() {
  return (
    <div className="page">
      <header>
        <div className="badge">
          <span className="dot" />
          <div>
            <div className="title">uiwwsw</div>
            <div className="subtitle">Matthew Yoon · Frontend Developer</div>
          </div>
        </div>
        <div className="links">
          <a href="https://github.com/uiwwsw" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="mailto:uiwwsw@icloud.com">Contact</a>
        </div>
      </header>

      <main>
        <Scene />
      </main>

      <section className="hero">
        <div className="eyebrow">Antigravity-inspired sandbox</div>
        <h1>
          Motion-crafted interface for an
          <span> unapologetically curious developer</span>
        </h1>
        <p>
          The field behind reacts to your cursor with breathing particles, shimmering ribbons, and
          subtle neon bloom—like bits of data hovering in zero-gravity.
        </p>
        <div className="chips">
          <span>React · three.js</span>
          <span>Procedural particles</span>
          <span>Interactive ambience</span>
        </div>
      </section>

      <footer>React · drei · three.js · GitHub Pages</footer>

      <div className="loading">Loading scene…</div>
    </div>
  );
}
