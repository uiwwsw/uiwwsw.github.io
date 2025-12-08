import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const WORDS = [
  "REACT", "KOREA", "FRONTEND", "WEB", "DESIGN", "CODE", "UI/UX", 
  "LOVE", "DREAM", "FUTURE", "ART", "SPACE", "VOID", "SIGNAL",
  "개발자", "프론트", "웹", "디자인", "꿈", "미래", "우주", "신호"
];

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ";

const PARTICLE_COUNT = 150;
const BOUNDS = 30;
const FONT_URL = 'https://fonts.gstatic.com/s/roboto/v29/KFOmCnqEu92Fr1Mu4mxK.woff2'; // Standard font, consider a Korean one if needed for better style

export function FloatingWords() {
  const { viewport, camera } = useThree();
  const [hovered, setHovered] = useState(false);
  
  // Particle State
  // We use refs for performance to avoid re-rendering the React component every frame
  const particles = useMemo(() => {
    return new Array(PARTICLE_COUNT).fill(0).map((_, i) => {
      const x = (Math.random() - 0.5) * BOUNDS;
      const y = (Math.random() - 0.5) * BOUNDS;
      const z = (Math.random() - 0.5) * 10; // Shallower depth
      return {
        id: i,
        initialPos: new THREE.Vector3(x, y, z),
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, 0),
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        targetChar: null,
        targetPos: null,
        isAssembling: false,
        scale: 1 + Math.random() * 0.5,
        color: new THREE.Color('#4444ff')
      };
    });
  }, []);

  // Assembly State
  const assemblyState = useRef({
    isForming: false,
    activeWord: null,
    activeIndices: [], // Indices of particles used in the word
    cooldown: 0,
    timer: 0
  });

  const groupRef = useRef();
  const mouseRef = useRef(new THREE.Vector3());

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const mouse = state.pointer; // Normalized -1 to 1
    
    // Unproject mouse to world space (approximate at z=0)
    mouseRef.current.set(mouse.x * viewport.width / 2, mouse.y * viewport.height / 2, 0);

    const { isForming, activeIndices, cooldown, timer } = assemblyState.current;

    // 1. Logic Update
    if (!isForming && cooldown <= 0) {
      // Check if we should trigger assembly
      // Trigger randomly or based on mouse movement? 
      // Let's trigger if mouse is moving slowly? Or just always try to form near mouse?
      // Let's try: Form a word every few seconds near the mouse
      
      if (Math.random() < 0.02) { // 2% chance per frame ~ once per second
        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        const wordLen = word.length;
        
        // Find closest particles
        const availableIndices = particles
          .map((p, i) => ({ idx: i, dist: p.pos.distanceTo(mouseRef.current) }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, wordLen)
          .map(item => item.idx);

        // Assign targets
        const spacing = 1.2;
        const startX = -(wordLen * spacing) / 2;
        
        availableIndices.forEach((idx, i) => {
          particles[idx].isAssembling = true;
          particles[idx].targetChar = word[i];
          // Target position relative to mouse
          particles[idx].targetPos = new THREE.Vector3(
            startX + i * spacing, 
            0, 
            2 // Bring closer to camera
          );
        });

        assemblyState.current.isForming = true;
        assemblyState.current.activeWord = word;
        assemblyState.current.activeIndices = availableIndices;
        assemblyState.current.timer = 3.0; // Hold for 3 seconds
      }
    } else if (isForming) {
      assemblyState.current.timer -= state.clock.getDelta();
      if (assemblyState.current.timer <= 0) {
        // Disperse
        assemblyState.current.isForming = false;
        assemblyState.current.activeIndices.forEach(idx => {
          particles[idx].isAssembling = false;
          // Explode velocity
          particles[idx].vel.set(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
          );
        });
        assemblyState.current.activeIndices = [];
        assemblyState.current.cooldown = 2.0; // Wait before next word
      }
    }

    if (assemblyState.current.cooldown > 0) {
      assemblyState.current.cooldown -= state.clock.getDelta();
    }

    // 2. Physics Update
    particles.forEach((p, i) => {
      if (p.isAssembling) {
        // Lerp to target (relative to mouse)
        const targetWorldPos = mouseRef.current.clone().add(p.targetPos);
        p.pos.lerp(targetWorldPos, 0.1);
        p.color.lerp(new THREE.Color('#ff00ff'), 0.1); // Hot pink for words
      } else {
        // Float naturally
        p.pos.add(p.vel);
        p.pos.y += Math.sin(time + p.id) * 0.002;
        
        // Wrap around bounds
        if (p.pos.x > BOUNDS) p.pos.x = -BOUNDS;
        if (p.pos.x < -BOUNDS) p.pos.x = BOUNDS;
        if (p.pos.y > BOUNDS) p.pos.y = -BOUNDS;
        if (p.pos.y < -BOUNDS) p.pos.y = BOUNDS;
        
        p.color.lerp(new THREE.Color('#4444ff'), 0.05); // Back to blue
      }
      
      // Update Scene Object (we need to access the Text children)
      // This is a bit tricky with React state. 
      // We will force update the refs directly if possible, or use a different approach.
      // Since we mapped `particles` to `Text` components, we can use refs array.
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <Particle 
          key={i} 
          particle={p} 
        />
      ))}
    </group>
  );
}

// Sub-component to manage individual particle refs and updates
const Particle = ({ particle }) => {
  const meshRef = useRef();
  const [displayChar, setDisplayChar] = useState(particle.char);

  useFrame(() => {
    if (!meshRef.current) return;

    // Update Position
    meshRef.current.position.copy(particle.pos);
    
    // Update Color
    meshRef.current.color = particle.color; // Text component handles color prop? No, material color.
    meshRef.current.material.color.copy(particle.color);

    // Update Text Content if changed (Assembly)
    if (particle.isAssembling && particle.targetChar && displayChar !== particle.targetChar) {
      setDisplayChar(particle.targetChar);
    } else if (!particle.isAssembling && displayChar !== particle.char) {
      setDisplayChar(particle.char);
    }
    
    // Look at camera?
    meshRef.current.lookAt(meshRef.current.position.x, meshRef.current.position.y, 100);
  });

  return (
    <Text
      ref={meshRef}
      font={FONT_URL}
      fontSize={particle.scale}
      color="#4444ff"
      anchorX="center"
      anchorY="middle"
    >
      {displayChar}
    </Text>
  );
};
