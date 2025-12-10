import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';
import { dom } from '../utils/dom.js';

let renderer;
let scene;
let camera;
let animationId;
let resizeHandler;
const ornaments = [];
let snowPoints;
let snowVelocities;
let snowCount = 0;

const buildStarfield = () => {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 260;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i += 3) {
    const spread = Math.max(window.innerWidth, window.innerHeight) / 40;
    positions[i] = (Math.random() - 0.5) * spread;
    positions[i + 1] = Math.random() * 12;
    positions[i + 2] = (Math.random() - 0.5) * spread * 0.65;
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

const buildGround = () => {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(32, 18),
    new THREE.MeshStandardMaterial({
      color: 0x0c1f15,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.9,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.2;
  scene.add(ground);

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(6.5, 48),
    new THREE.MeshBasicMaterial({ color: 0x1be8a8, transparent: true, opacity: 0.12 })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -1.19;
  scene.add(glow);
};

const buildTree = () => {
  const tree = new THREE.Group();
  const coneMaterial = new THREE.MeshStandardMaterial({
    color: 0x0c7c37,
    roughness: 0.5,
    metalness: 0.2,
    emissive: 0x063016,
  });
  const layers = [
    { radius: 1.4, height: 2.2, y: 0.1 },
    { radius: 1.2, height: 1.8, y: 1.1 },
    { radius: 1, height: 1.4, y: 1.9 },
  ];
  layers.forEach((layer, idx) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(layer.radius, layer.height, 22), coneMaterial);
    cone.position.y = layer.y + idx * 0.2;
    tree.add(cone);
  });

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.35, 0.6, 12),
    new THREE.MeshStandardMaterial({ color: 0x5a3314, roughness: 0.9 })
  );
  trunk.position.y = -0.9;
  tree.add(trunk);

  const topper = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.35, 0),
    new THREE.MeshStandardMaterial({ color: 0xffe070, emissive: 0xffc857, metalness: 0.6 })
  );
  topper.position.y = 2.5;
  tree.add(topper);

  const ornamentMat = new THREE.MeshStandardMaterial({ color: 0xff69b4, emissive: 0x441126, metalness: 0.8 });
  for (let i = 0; i < 10; i++) {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), ornamentMat);
    const angle = (i / 10) * Math.PI * 2;
    orb.position.set(Math.cos(angle) * 0.9, 0.1 + Math.random() * 1.8, Math.sin(angle) * 0.9);
    tree.add(orb);
  }

  tree.position.set(-0.5, -0.1, -0.5);
  scene.add(tree);
};

const buildCandyCane = (x, z, flip = false) => {
  const cane = new THREE.Group();
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 2.2, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.2 })
  );
  stick.position.y = 0.1;
  cane.add(stick);

  const hook = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.11, 12, 30, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.25 })
  );
  hook.position.set(0, 1.2, 0.3);
  hook.rotation.z = Math.PI / 2;
  hook.rotation.y = flip ? Math.PI : 0;
  cane.add(hook);

  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xff2f6d, emissive: 0x2a020f, metalness: 0.4 });
  for (let i = -1; i < 2; i++) {
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.05, 8, 12), stripeMat);
    stripe.position.set(0, i * 0.6, 0);
    stripe.rotation.x = Math.PI / 2;
    cane.add(stripe);
  }

  cane.position.set(x, -0.9, z);
  scene.add(cane);
};

const buildSnowfield = () => {
  snowCount = 420;
  const positions = new Float32Array(snowCount * 3);
  snowVelocities = new Float32Array(snowCount);
  const spread = Math.max(window.innerWidth, window.innerHeight) / 38;
  for (let i = 0; i < snowCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = Math.random() * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    snowVelocities[i] = 0.4 + Math.random() * 0.8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  snowPoints = new THREE.Points(geometry, material);
  scene.add(snowPoints);
};

const tick = () => {
  ornaments.forEach((mesh, idx) => {
    mesh.rotation.y += 0.006 + idx * 0.001;
    mesh.rotation.x += 0.004;
    mesh.position.y = Math.sin(Date.now() * 0.001 + idx) * 0.5 + 0.6 + idx * 0.04;
  });
  if (snowPoints) {
    const pos = snowPoints.geometry.getAttribute('position');
    const arr = pos.array;
    const time = Date.now() * 0.001;
    const spread = Math.max(window.innerWidth, window.innerHeight) / 40;
    for (let i = 0; i < snowCount; i++) {
      arr[i * 3 + 1] -= snowVelocities[i] * 0.02;
      arr[i * 3] += Math.sin(time + i) * 0.004;
      if (arr[i * 3 + 1] < -2) {
        arr[i * 3 + 1] = 7.5;
        arr[i * 3] = (Math.random() - 0.5) * spread;
      }
    }
    pos.needsUpdate = true;
  }
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
    dom.threeCanvas.style.opacity = '0.95';

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0c1f12, 0.06);

    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 60);
    camera.position.set(0, 1.8, 7.5);

    const ambient = new THREE.AmbientLight(0xa0fff0, 0.9);
    const warm = new THREE.PointLight(0xffc38b, 1.5, 24);
    warm.position.set(2.5, 2, 5);
    const cool = new THREE.PointLight(0x7ed1ff, 0.9, 20);
    cool.position.set(-3, 1, 3);
    const moon = new THREE.PointLight(0xb8d1ff, 0.4, 30);
    moon.position.set(0, 6, -2);
    scene.add(ambient, warm, cool, moon);

    const palette = [0xff5470, 0xffc857, 0x8bf1ff, 0x9eff8a];
    palette.forEach((color, idx) => makeOrnament(color, idx));

    buildStarfield();
    buildGround();
    buildTree();
    buildCandyCane(-2.8, 1.8, true);
    buildCandyCane(2.8, 1.6, false);
    buildSnowfield();

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
  snowPoints = null;
  snowVelocities = null;
  snowCount = 0;
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss?.();
  }
  if (dom.threeCanvas) dom.threeCanvas.style.opacity = '0';
  renderer = null;
  scene = null;
  camera = null;
};
