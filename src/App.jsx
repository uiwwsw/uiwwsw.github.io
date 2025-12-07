import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import './index.css';

// --------------------------------------------------------
// Shaders for the "Antigravity" Effect
// --------------------------------------------------------

const particleVertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uHover;
  
  attribute vec3 aRandom; // x: size variation, y: speed variation, z: chaotic offset
  attribute vec3 aColor;  // customized color per particle
  
  varying vec3 vColor;
  varying float vAlpha;
  
  // Simplex Noise (simplified for performance)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    
    // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    
    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
    
    // Permutations
    i = mod289(i); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
             
    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    
    //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vColor = aColor;
    
    // Initial position based on time and speed
    vec3 pos = position;
    
    // "Antigravity" Rise
    float riseSpeed = 0.5 * aRandom.y + 0.2;
    float timeOffset = uTime * riseSpeed;
    
    // Loop y position to keep particles in view
    pos.y = mod(pos.y + timeOffset, 20.0) - 10.0;
    
    // Noise Movement (Turbulence)
    float noiseFreq = 0.5;
    float noiseAmp = 1.2;
    vec3 noisePos = vec3(pos.x * noiseFreq + uTime * 0.1, pos.y * noiseFreq, pos.z * noiseFreq);
    vec3 noise = vec3(
      snoise(noisePos),
      snoise(noisePos + 100.0),
      snoise(noisePos + 200.0)
    );
    
    pos += noise * noiseAmp;
    
    // Mouse Interaction (Repulsion/Attraction)
    // Convert mouse to world space roughly for effect
    // We assume the camera is at Z=0 looking at Z=-20 or similar, but for this effect
    // We project the mouse ray into the volume.
    // Simplified: Just use x/y influence
    
    float dist = distance(pos.xy, uMouse * 15.0); // Scale mouse to world coords roughly
    float interactionRadius = 6.0;
    
    if (dist < interactionRadius) {
      vec3 dir = normalize(pos - vec3(uMouse * 15.0, 0.0));
      float force = (1.0 - dist / interactionRadius);
      // Push particles away violently
      pos += dir * force * 5.0 * uHover; 
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    float size = (20.0 * aRandom.x + 10.0) * (1.0 / -mvPosition.z);
    gl_PointSize = size;
    
    // Distance fading
    float alpha = smoothstep(15.0, 0.0, abs(pos.y)); // Fade at top/bottom
    vAlpha = alpha;
  }
`;

const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    // Circular particle
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    // Soft glow edge
    float glow = 1.0 - smoothstep(0.3, 0.5, r);
    
    gl_FragColor = vec4(vColor, vAlpha * glow);
    
    // Tone mapping helper (optional, simple reinhard)
    // gl_FragColor.rgb = gl_FragColor.rgb / (gl_FragColor.rgb + vec3(1.0));
  }
`;

// --------------------------------------------------------
// Particle System Component
// --------------------------------------------------------

const ParticleField = () => {
  const meshRef = useRef();
  const args = useMemo(() => {
    const count = 4000;
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const palette = [
      new THREE.Color('#7c3aed'), // Violet
      new THREE.Color('#06b6d4'), // Cyan
      new THREE.Color('#f472b6'), // Pink
      new THREE.Color('#ffffff')  // White accent
    ];

    for (let i = 0; i < count; i++) {
      // Random positions in a large cube
      positions[i * 3] = (Math.random() - 0.5) * 30;     // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z

      // Random attributes
      randoms[i * 3] = Math.random(); // size variation
      randoms[i * 3 + 1] = Math.random(); // speed variation
      randoms[i * 3 + 2] = Math.random(); // chaotic offset

      // Color
      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, randoms, colors };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uHover: { value: 0 }
  }), []);

  const { pointer } = useThree();
  const targetHover = useRef(0);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;

      // Smooth mouse lerp
      meshRef.current.material.uniforms.uMouse.value.lerp(pointer, 0.1);

      // Hover effect intensity
      // If mouse is moving, increase "hover" (disturbance) value
      const speed = Math.abs(pointer.x - meshRef.current.material.uniforms.uMouse.value.x) +
        Math.abs(pointer.y - meshRef.current.material.uniforms.uMouse.value.y);
      targetHover.current = THREE.MathUtils.lerp(targetHover.current, speed * 20.0 + 0.5, 0.05);
      meshRef.current.material.uniforms.uHover.value = targetHover.current;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={args.positions.length / 3}
          array={args.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={args.randoms.length / 3}
          array={args.randoms}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={args.colors.length / 3}
          array={args.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        uniforms={uniforms}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        transparent
      />
    </points>
  );
};

// --------------------------------------------------------
// Main Scenery
// --------------------------------------------------------

export default function App() {
  return (
    <>
      <div className="canvas-container">
        <Canvas gl={{ antialias: false, alpha: false }}>
          <color attach="background" args={['#050505']} />
          <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />

          <ParticleField />

          <Environment preset="city" />
          <ambientLight intensity={0.5} />
        </Canvas>
      </div>

      <div className="overlay">
        <header className="header">
          <div className="logo">uiwwsw</div>
          <nav>
            <a href="https://github.com/uiwwsw" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="mailto:uiwwsw@icloud.com">Email</a>
          </nav>
        </header>

        <main className="content">
          <h1>
            <span className="gradient-text">Antigravity</span>
            <br />
            Explorer
          </h1>
          <p className="subtitle">
            Frontend Developer based in Seoul.
            <br />
            Crafting digital experiences that defy expectations.
          </p>

          <div className="stats">
            <div className="stat-item">
              <span className="value">TypeScript</span>
              <span className="label">Stack</span>
            </div>
            <div className="stat-item">
              <span className="value">React</span>
              <span className="label">Core</span>
            </div>
            <div className="stat-item">
              <span className="value">Three.js</span>
              <span className="label">Visuals</span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

