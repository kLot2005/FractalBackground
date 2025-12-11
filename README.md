# FractalBackground.js

A lightweight, zero-dependency WebGL library for creating high-performance, immersive fractal backgrounds.

## Features
- 🚀 **WebGL Powered**: Runs entirely on the GPU for 60fps performance.
- 🎨 **Minimalist Design**: smooth gradient coloring using the "Deep Ocean" or custom palettes.
- 🖱️ **Interactive**: Reacts to mouse movement with fluid deformations.
- ⚙️ **Configurable**: Easily tweak colors, animation speed, and interaction strength.

## Installation

Simply include the `fractal.js` file in your project:

```html
<script src="js/fractal.js"></script>
```

## Usage

Initialize the library on any `<canvas>` element:

```javascript
/* style.css */
#my-canvas {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: -1;
}
```

```javascript
/* script.js */
const fractal = new FractalBackground('my-canvas', {
    colors: {
        start: [0.05, 0.08, 0.12], // RGB 0-1 (Dark Blue)
        end: [0.2, 0.5, 0.55]      // RGB 0-1 (Teal)
    },
    animation: {
        speed: 1.0 // Animation speed multiplier
    },
    interaction: {
        enabled: true,
        strength: 1.5 // Mouse interaction strength
    }
});
```

## License

MIT
