import { dom, setAccent } from './utils/dom.js';
import { state, cleanupTimers } from './utils/state.js';
import { wireOrnamentAccessibility } from './utils/accessibility.js';
import { initParallax } from './effects/parallax.js';
import { initKonami } from './effects/konami.js';
import { startSnowfall, stopSnowfall } from './effects/snowfall.js';
import { initGlow, stopGlow } from './effects/webglGlow.js';
import { initScreenshot } from './utils/screenshot.js';
import { initSettings } from './utils/settings.js';
import { SnowConsole } from './games/snowConsole.js';
import { ReactionLab } from './games/reactionLab.js';
import { PresentHunt } from './games/presentHunt.js';
import { Jukebox } from './games/jukebox.js';
import { RetroTheater } from './games/theater.js';

const controllers = {
  snow: SnowConsole,
  react: ReactionLab,
  hunt: PresentHunt,
  jukebox: Jukebox,
  theater: RetroTheater,
};

const accentMap = {
  snow: '#13c2ff',
  react: '#ff8bf0',
  hunt: '#39ff14',
  jukebox: '#ffb347',
  theater: '#ff718d',
};

const activateGame = (id) => {
  cleanupTimers();
  dom.ornaments.forEach((o) => o.classList.toggle('active', o.dataset.id === id));
  const accent = accentMap[id] || '#39ff14';
  setAccent(accent);
  controllers[id]?.render();
};

const initInteractions = () => {
  wireOrnamentAccessibility(activateGame);
  initParallax();
  initKonami();
  initScreenshot();
};

const applyMotionPreference = (reduced) => {
  if (reduced) {
    stopSnowfall();
    dom.tree.style.transform = 'none';
  } else if (state.preferences.snowfall) {
    startSnowfall();
  }
};

const boot = () => {
  initInteractions();

  initSettings({
    onSnowToggle: (enabled) => {
      if (enabled) startSnowfall();
      else stopSnowfall();
    },
    onWebglToggle: (enabled) => {
      if (enabled) initGlow();
      else stopGlow();
    },
    onMotionToggle: (reduced) => applyMotionPreference(reduced),
  });

  if (state.preferences.webgl) {
    initGlow();
  }
  if (state.preferences.snowfall) {
    startSnowfall();
  }
  if (state.preferences.reducedMotion) {
    applyMotionPreference(true);
  }

  dom.postcardBtn.setAttribute('aria-live', 'polite');
  activateGame('snow');
};

document.addEventListener('DOMContentLoaded', boot);
