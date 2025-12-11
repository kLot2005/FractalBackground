/**
 * FractalBackground.js
 * 
 * A lightweight WebGL library for rendering live fractal backgrounds.
 * 
 * @author Ka15err
 * @version 1.0.0
 * @GitHub https://github.com/kLot2005/FractalBackground   
 * @license MIT
 */
class FractalBackground {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found.`);
            return;
        }

        this.gl = this.canvas.getContext('webgl');
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }

        // Default Config
        this.config = {
            colors: {
                start: options.colors?.start || [0.05, 0.08, 0.12],
                end: options.colors?.end || [0.2, 0.5, 0.55]
            },
            interaction: {
                enabled: options.interaction?.enabled !== false,
                strength: options.interaction?.strength || 1.5
            },
            animation: {
                speed: options.animation?.speed || 1.0
            }
        };

        this.mouseX = 0;
        this.mouseY = 0;
        this.startTime = Date.now();

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        if (this.config.interaction.enabled) {
            document.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = this.canvas.height - e.clientY;
            });
        }

        this.createShaders();
        this.createBuffer();
        this.startAnimation();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    createShaders() {
        const vsSource = `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fsSource = `
            precision highp float;
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform float u_time;
            uniform vec3 u_colorStart;
            uniform vec3 u_colorEnd;
            uniform float u_speed;
            uniform float u_strength;

            void main() {
                vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
                uv *= 2.5; // Zoom

                // Mouse & Auto movement
                float time = u_time * u_speed;
                vec2 auto_anim = vec2(sin(time * 0.3) * 0.1, cos(time * 0.2) * 0.1);
                vec2 mouse_offset = (u_mouse / u_resolution.xy - 0.5) * u_strength;
                vec2 c = vec2(-0.8, 0.156) + auto_anim + mouse_offset;

                vec2 z = uv;
                float iter = 0.0;
                const float max_iter = 100.0;

                for (float i = 0.0; i < max_iter; i++) {
                    float x = (z.x * z.x - z.y * z.y) + c.x;
                    float y = (2.0 * z.x * z.y) + c.y;
                    z = vec2(x, y);
                    if (length(z) > 2.0) break;
                    iter++;
                }

                float t = iter / max_iter;
                vec3 color = vec3(0.0);
                
                if (iter < max_iter) {
                     float smooth_val = iter - log2(log2(dot(z,z))) + 4.0;
                     t = smooth_val / max_iter;
                     
                     // Use Uniform Colors
                     float glow = pow(t, 0.5) * (0.8 + sin(u_time * 0.5) * 0.2);
                     color = mix(u_colorStart, u_colorEnd, glow);
                } else {
                    color = vec3(0.01, 0.01, 0.02); // Void color
                }

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const vs = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
        const fs = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vs);
        this.gl.attachShader(this.program, fs);
        this.gl.linkProgram(this.program);
        this.gl.useProgram(this.program);
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    createBuffer() {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
        ]), this.gl.STATIC_DRAW);

        const posLoc = this.gl.getAttribLocation(this.program, "position");
        this.gl.enableVertexAttribArray(posLoc);
        this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 0, 0);
    }

    startAnimation() {
        const u_res = this.gl.getUniformLocation(this.program, "u_resolution");
        const u_mouse = this.gl.getUniformLocation(this.program, "u_mouse");
        const u_time = this.gl.getUniformLocation(this.program, "u_time");
        const u_colStart = this.gl.getUniformLocation(this.program, "u_colorStart");
        const u_colEnd = this.gl.getUniformLocation(this.program, "u_colorEnd");
        const u_speed = this.gl.getUniformLocation(this.program, "u_speed");
        const u_strength = this.gl.getUniformLocation(this.program, "u_strength");

        const loop = () => {
            const time = (Date.now() - this.startTime) * 0.001;

            this.gl.uniform2f(u_res, this.canvas.width, this.canvas.height);
            this.gl.uniform2f(u_mouse, this.mouseX, this.mouseY);
            this.gl.uniform1f(u_time, time);

            // Pass colors safely
            this.gl.uniform3fv(u_colStart, this.config.colors.start);
            this.gl.uniform3fv(u_colEnd, this.config.colors.end);

            this.gl.uniform1f(u_speed, this.config.animation.speed);
            this.gl.uniform1f(u_strength, this.config.interaction.strength);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
            requestAnimationFrame(loop);
        };
        loop();
    }
}
