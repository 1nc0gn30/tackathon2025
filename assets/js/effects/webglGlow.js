import { dom } from '../utils/dom.js';

let gl;
let program;
let animationId;
let start;

const vertexSrc = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragSrc = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_res;
  void main() {
    vec2 st = gl_FragCoord.xy / u_res.xy;
    float glow = sin((st.x + st.y + u_time * 0.2) * 10.0) * 0.5 + 0.5;
    float pulse = sin(u_time * 0.7) * 0.5 + 0.5;
    vec3 color = mix(vec3(0.0, 0.1, 0.25), vec3(0.0, 0.9, 0.4), glow);
    color += pulse * 0.1;
    gl_FragColor = vec4(color, 0.35);
  }
`;

const compile = (type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('Shader error', gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
};

const createProgram = () => {
  const vs = compile(gl.VERTEX_SHADER, vertexSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return;
  program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Program link error', gl.getProgramInfoLog(program));
  }
  gl.useProgram(program);
  const vertices = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1,
  ]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
};

const resize = () => {
  const { width, height } = dom.webglCanvas.getBoundingClientRect();
  dom.webglCanvas.width = width;
  dom.webglCanvas.height = height;
  gl.viewport(0, 0, width, height);
};

const render = (timestamp) => {
  if (!start) start = timestamp;
  const time = (timestamp - start) / 1000;
  gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time);
  gl.uniform2f(gl.getUniformLocation(program, 'u_res'), dom.webglCanvas.width, dom.webglCanvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  animationId = requestAnimationFrame(render);
};

export const initGlow = () => {
  try {
    gl = dom.webglCanvas.getContext('webgl', { premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL unavailable');
    createProgram();
    resize();
    dom.webglCanvas.style.opacity = '0.6';
    window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(render);
  } catch (err) {
    dom.webglCanvas.style.display = 'none';
    console.warn('WebGL fallback engaged', err);
  }
};

export const stopGlow = () => {
  if (animationId) cancelAnimationFrame(animationId);
  if (gl) gl.getExtension('WEBGL_lose_context')?.loseContext();
  dom.webglCanvas.style.opacity = '0';
};
