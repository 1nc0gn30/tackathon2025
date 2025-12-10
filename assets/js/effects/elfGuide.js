import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/GLTFLoader.js';

let renderer;
let scene;
let camera;
let mixer;
let clock;
let guideEl;
let dialogEl;
let driftStart = null;
let driftRaf;

const messages = [
  'Elf Tip: shake your mouse to add sparkle boosts.',
  'Reflex hack: inhale on ARM, exhale on GO.',
  'Every streak above 3 unlocks bonus cheer.',
  'Stay cozy. The arcade loves mindful players.',
  'Move with the music — elves do too.',
];

const pickMessage = () => messages[Math.floor(Math.random() * messages.length)];

const ensureContainer = () => {
  guideEl = document.getElementById('elfGuide');
  if (guideEl) {
    dialogEl = guideEl.querySelector('.elf-dialog');
    return true;
  }
  const wrapper = document.createElement('div');
  wrapper.id = 'elfGuide';
  wrapper.className = 'elf-guide';
  const dialog = document.createElement('div');
  dialog.className = 'elf-dialog';
  wrapper.appendChild(dialog);
  document.body.appendChild(wrapper);
  guideEl = wrapper;
  dialogEl = dialog;
  return true;
};

const positionGuide = (progress) => {
  if (!guideEl) return;
  const width = window.innerWidth;
  const startX = -220;
  const endX = width + 160;
  const x = startX + (endX - startX) * progress;
  const baseY = Math.min(window.innerHeight * 0.18 + 40, 260);
  const wave = Math.sin(progress * Math.PI * 2) * 24;
  guideEl.style.transform = `translate3d(${x}px, ${baseY + wave}px, 0)`;
};

const drift = (timestamp) => {
  if (driftStart === null) driftStart = timestamp;
  const duration = 22000;
  const elapsed = timestamp - driftStart;
  const progress = Math.min(elapsed / duration, 1);
  positionGuide(progress);
  if (progress < 1) {
    driftRaf = requestAnimationFrame(drift);
  } else {
    guideEl?.classList.remove('visible');
    setTimeout(() => {
      driftStart = null;
      dialogEl.textContent = pickMessage();
      guideEl?.classList.add('visible');
      driftRaf = requestAnimationFrame(drift);
    }, 10500);
  }
};

const renderLoop = () => {
  if (mixer && clock) {
    mixer.update(clock.getDelta());
  }
  renderer?.render(scene, camera);
  requestAnimationFrame(renderLoop);
};

const startGuide = () => {
  if (!guideEl) return;
  if (!dialogEl.textContent) dialogEl.textContent = pickMessage();
  guideEl.classList.add('visible');
  requestAnimationFrame(drift);
};

const loadElfModel = () => {
  const loader = new GLTFLoader();
  loader.load(
    'assets/elf.glb',
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(1.6, 1.6, 1.6);
      model.position.set(0, -0.8, 0);
      scene.add(model);
      if (gltf.animations?.length) {
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
          mixer.clipAction(clip).setLoop(THREE.LoopRepeat).play();
        });
      }
      startGuide();
    },
    undefined,
    () => {
      guideEl?.classList.add('fallback');
      startGuide();
    }
  );
};

export const initElfGuide = () => {
  if (!ensureContainer()) return;

  scene = new THREE.Scene();
  clock = new THREE.Clock();
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 30);
  camera.position.set(0.6, 1.4, 3.4);

  const ambient = new THREE.HemisphereLight(0xffffff, 0x222233, 0.9);
  const dir = new THREE.DirectionalLight(0x8df5ff, 1.1);
  dir.position.set(2, 3, 2);
  scene.add(ambient, dir);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(180, 180);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.className = 'elf-guide-canvas';
  guideEl.appendChild(renderer.domElement);

  loadElfModel();
  renderLoop();

  const handleResize = () => {
    const size = Math.min(200, Math.max(160, window.innerWidth * 0.18));
    renderer?.setSize(size, size);
  };
  window.addEventListener('resize', handleResize);
  handleResize();
};
