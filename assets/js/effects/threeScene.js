import { dom } from '../utils/dom.js';

let renderer;
let scene;
let camera;
let animationId;
let resizeHandler;
const ornaments = [];

const buildStarfield = () => {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 260;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 24;
    positions[i + 1] = Math.random() * 10;
    positions[i + 2] = (Math.random() - 0.5) * 16;
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xfff5d9,
    size: 0.12,
    transparent: true,
    opacity: 0.9,
  });
  const points = new THREE.Points(starGeometry, material);
  scene.add(points);
};

const makeOrnament = (color, offset) => {
  const geometry = new THREE.IcosahedronGeometry(0.55, 1);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.18,
    metalness: 0.9,
    emissive: new THREE.Color(color).multiplyScalar(0.15),
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(offset * 1.4 - 2.2, Math.sin(offset) * 0.5 + 0.4, -0.6 - offset * 0.4);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  scene.add(mesh);
  ornaments.push(mesh);
};

const tick = () => {
  ornaments.forEach((mesh, idx) => {
    mesh.rotation.y += 0.006 + idx * 0.001;
    mesh.rotation.x += 0.004;
    mesh.position.y = Math.sin(Date.now() * 0.001 + idx) * 0.5 + 0.6 + idx * 0.04;
  });
  renderer.render(scene, camera);
  animationId = requestAnimationFrame(tick);
};

export const initThreeScene = () => {
  try {
    if (!dom.threeCanvas || typeof THREE === 'undefined') return;

    renderer = new THREE.WebGLRenderer({
      canvas: dom.threeCanvas,
      alpha: true,
      antialias: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    dom.threeCanvas.style.opacity = '0.85';

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0c1f12, 0.08);

    camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      40
    );
    camera.position.set(0, 1.5, 6.5);

    const ambient = new THREE.AmbientLight(0xa0fff0, 0.8);
    const warm = new THREE.PointLight(0xffc38b, 1.4, 22);
    warm.position.set(2, 2, 4);
    const cool = new THREE.PointLight(0x7ed1ff, 0.9, 18);
    cool.position.set(-3, 1, 2);
    scene.add(ambient, warm, cool);

    const palette = [0xff5470, 0xffc857, 0x8bf1ff, 0x9eff8a];
    palette.forEach((color, idx) => makeOrnament(color, idx));

    buildStarfield();

    const resize = () => {
      const { innerWidth, innerHeight } = window;
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    };

    resize();
    resizeHandler = resize;
    window.addEventListener('resize', resizeHandler);
    tick();
  } catch (err) {
    console.warn('Three.js scene fallback', err);
    dom.threeCanvas.style.display = 'none';
  }
};

export const stopThreeScene = () => {
  if (animationId) cancelAnimationFrame(animationId);
  if (resizeHandler) window.removeEventListener('resize', resizeHandler);
  ornaments.length = 0;
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss?.();
  }
  if (dom.threeCanvas) dom.threeCanvas.style.opacity = '0';
  renderer = null;
  scene = null;
  camera = null;
};
