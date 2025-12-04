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

        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.35}
          scale={5}
          blur={1.8}
          far={2.4}
          color="#111827"
        />
      </HoverRig>

      <Sparkles count={120} speed={0.3} opacity={0.3} color={sparkColor} scale={5} size={4} />
      <Sparkles count={120} speed={0.25} opacity={0.23} color={sparkColor2} scale={5} size={4} />

      <Environment preset="night" background>
        <mesh>
          <sphereGeometry args={[20, 32, 32]} />
          <meshBasicMaterial color="#050811" side={THREE.BackSide} />
        </mesh>
      </Environment>

      <EffectComposer>
        <Bloom mipmapBlur intensity={1.35} luminanceThreshold={0.2} radius={0.8} />
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

      <footer>React · drei · three.js · GitHub Pages</footer>

      <div className="loading">Loading scene…</div>
    </div>
  );
}
