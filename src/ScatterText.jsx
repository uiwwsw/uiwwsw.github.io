import React, { useRef, useEffect, useState } from 'react';

const ScatterText = ({ children, className = '', ...props }) => {
    const containerRef = useRef(null);
    const requestRef = useRef();
    const mouseRef = useRef({ x: -9999, y: -9999 });
    const particlesRef = useRef([]); // Stores position/velocity data for each char

    // Convert children string to array of characters
    // We only support simple string children for this effect
    const text = typeof children === 'string' ? children : '';
    const chars = text.split('');

    useEffect(() => {
        // Initialize particles
        // We need to measure their initial positions after render
        // But for a simple effect, we can treat their flow relative to their natural position
        // by using transform: translate(x, y). 
        // Initially x=0, y=0.

        // We'll init the particles array to match chars length
        particlesRef.current = chars.map(() => ({
            x: 0, // current offset x
            y: 0, // current offset y
            vx: 0, // velocity x
            vy: 0, // velocity y
            ox: 0, // original x (relative to span, always 0)
            oy: 0  // original y (relative to span, always 0)
        }));
    }, [children]); // Re-init if text changes

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        // Listen globally or on window to ensure we catch mouse even if it leaves the specific element quickly
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const animate = () => {
            const container = containerRef.current;
            if (!container) return;

            const spans = container.children;
            if (spans.length !== particlesRef.current.length) {
                // Mismatch usually on first render or re-render
                requestRef.current = requestAnimationFrame(animate);
                return;
            }

            // Physics Constants
            const REPULSION_RADIUS = 100;
            const REPULSION_STRENGTH = 5.0; // Pushing force
            const RETURN_STRENGTH = 0.05;   // Spring stiffness (pull back to origin)
            const DAMPING = 0.90;           // Friction

            particlesRef.current.forEach((p, i) => {
                const span = spans[i];
                const rect = span.getBoundingClientRect();
                // Particle center in world space
                // We add p.x/p.y to rect because rect moves as we transform! 
                // Wait, getBoundingClientRect INCLUDES the transform. 
                // To get the "origin" world position, we must subtract current current p.x/p.y
                const centerX = rect.left + rect.width / 2 - p.x;
                const centerY = rect.top + rect.height / 2 - p.y;

                // Distance to mouse
                const dx = mouseRef.current.x - centerX;
                const dy = mouseRef.current.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Repulsion Force
                let fx = 0;
                let fy = 0;

                if (dist < REPULSION_RADIUS) {
                    const force = (REPULSION_RADIUS - dist) / REPULSION_RADIUS; // 0 to 1
                    const dirX = dx / dist;
                    const dirY = dy / dist;

                    // Push AWAY from mouse
                    fx -= dirX * force * REPULSION_STRENGTH;
                    fy -= dirY * force * REPULSION_STRENGTH;
                }

                // Spring Force (Return to 0,0)
                // Target is (0,0) relative to origin
                const springX = -p.x * RETURN_STRENGTH;
                const springY = -p.y * RETURN_STRENGTH;

                // Update Velocity
                p.vx += fx + springX;
                p.vy += fy + springY;

                // Damping
                p.vx *= DAMPING;
                p.vy *= DAMPING;

                // Update Position
                p.x += p.vx;
                p.y += p.vy;

                // Apply transform
                // We use translate3d for GPU accel
                // Only update if absolute value is significant to save layout thrashing? 
                // Actually modifying style.transform is layout-safe-ish (compositor only)
                span.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
            });

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [children]);

    return (
        <span ref={containerRef} className={className} {...props} style={{ display: 'inline-block', ...props.style }}>
            {chars.map((char, i) => (
                <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre' }}>{char}</span>
            ))}
        </span>
    );
};

export default ScatterText;
