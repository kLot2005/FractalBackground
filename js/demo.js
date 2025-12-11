/**
 * Demo Configuration
 * This file shows how to initialize the FractalBackground library.
 */

// Initialize the Fractal Background
const fractal = new FractalBackground('fractal-canvas', {
    colors: {
        // Deep Ocean Minimalist Palette
        start: [0.05, 0.08, 0.12], // Deep darker blue
        end: [0.2, 0.5, 0.55]      // Muted teal
    },
    interaction: {
        enabled: true,
        strength: 1.5
    },
    animation: {
        speed: 1.5 // Контроль скорости
    }
});
