const canvas = document.getElementById('fractal-canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('WebGL not supported');
}

// Fullscreen canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Vertex Shader (Simple pass-through)
const vertexShaderSource = `
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

// Fragment Shader (Julia Set Fractal)
const fragmentShaderSource = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;

    // Convert HSV to RGB for beautiful coloring
    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
        
        // Dynamic zoom and pan based on time or interaction
        uv *= 2.5; // Zoom level

        vec2 mouse = u_mouse / u_resolution.xy;
        
        // Base value + dynamic mouse offset
        // We combine automatic smooth movement with user interaction
        
        // 1. Base automatic movement (slow breathing)
        vec2 auto_anim = vec2(sin(u_time * 0.3) * 0.1, cos(u_time * 0.2) * 0.1);
        
        // 2. Mouse influence (offset from center)
        // If mouse is at 0,0 (start), influence is minimal
        vec2 mouse_offset = (u_mouse / u_resolution.xy - 0.5) * 1.5;
        
        // Combine them: Start at a cool spot (-0.8, 0.156) + Animation + Mouse
        vec2 c = vec2(-0.8, 0.156) + auto_anim + mouse_offset;

        vec2 z = uv;
        float iter = 0.0;
        const float max_iter = 100.0;

        // The Fractal Loop
        for (float i = 0.0; i < max_iter; i++) {
            // z = z^2 + c
            // (x + yi)^2 = x^2 - y^2 + 2xyi
            float x = (z.x * z.x - z.y * z.y) + c.x;
            float y = (2.0 * z.x * z.y) + c.y;
            
            z = vec2(x, y);
            
            // Escape condition: if magnitude > 2, it flies off to infinity
            if (length(z) > 2.0) break;
            iter++;
        }

        // Smooth coloring
        float t = iter / max_iter;
        
        // Color palette based on iteration count
        vec3 color = vec3(0.0);
        
        if (iter < max_iter) {
             // Interior is black (or dark), exterior gets color
             // We use log smoothing allows for smoother gradients
             float smooth_val = iter - log2(log2(dot(z,z))) + 4.0;
             t = smooth_val / max_iter;
             
             // Minimalist Palette
             // We map the iteration count 't' to a smooth gradient between two colors
             
             // Deep dark blue/grey for the base
             vec3 colorStart = vec3(0.05, 0.08, 0.12);
             
             // Muted teal/cyan for the fractal details (less bright)
             vec3 colorEnd = vec3(0.2, 0.5, 0.55);
             
             // Pow function shapes the glow to be more concentrated
             // Adding a subtle time pulse to the brightness
             float glow = pow(t, 0.5) * (0.8 + sin(u_time * 0.5) * 0.2);
             
             color = mix(colorStart, colorEnd, glow);
        } else {
            // Inside the set (Deep Void)
            color = vec3(0.01, 0.01, 0.02); 
        }

        gl_FragColor = vec4(color, 1.0);
    }
`;

// Helper to compile shaders
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
}

// Set up rectangle covering the canvas (2 triangles)
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const positionAttributeLocation = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

gl.useProgram(program);

// Uniform locations
const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
const mouseUniformLocation = gl.getUniformLocation(program, "u_mouse");
const timeUniformLocation = gl.getUniformLocation(program, "u_time");

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = canvas.height - e.clientY; // Flip Y for shader coords
});

// Animation Loop
function render(time) {
    time *= 0.001; // Convert to seconds

    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
    gl.uniform2f(mouseUniformLocation, mouseX, mouseY);
    gl.uniform1f(timeUniformLocation, time);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
