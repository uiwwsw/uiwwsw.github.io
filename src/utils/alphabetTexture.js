import * as THREE from 'three';

/**
 * Generates a texture atlas containing letters A-Z and some symbols.
 * Returns the texture and the grid dimensions.
 */
export const createAlphabetTexture = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Settings
    const size = 1024; // Texture size
    const cols = 8;    // Grid columns
    const rows = 8;    // Grid rows
    const cellSize = size / cols;

    canvas.width = size;
    canvas.height = size;

    // Font settings
    ctx.font = `bold ${cellSize * 0.7}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';

    // Characters to include
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Draw characters
    for (let i = 0; i < chars.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        if (row >= rows) break;

        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;

        // Add specific "digital" glow effect to the texture itself if desired,
        // but better to keep it clean for shader coloring.
        ctx.fillText(chars[i], x, y);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    // texture.needsUpdate = true; // CanvasTexture does this automatically on creation usually

    return {
        texture,
        cols,
        rows,
        count: chars.length
    };
};
