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
import { SantaTracker } from './games/santaTracker.js';

const controllers = {
  snow: SnowConsole,
  react: ReactionLab,
  hunt: PresentHunt,
  jukebox: Jukebox,
  theater: RetroTheater,
  santa: SantaTracker,
};

const accentMap = {
  snow: '#13c2ff',
  react: '#ff8bf0',
  hunt: '#39ff14',
  jukebox: '#ffb347',
  theater: '#ff718d',
  santa: '#ffc107',
};

const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => char + char)
        .join('')
    : normalized;
  const int = parseInt(value, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

const mixColors = (base, overlay) => {
  const a = hexToRgb(base);
  const b = hexToRgb(overlay);
  const blend = (aVal, bVal) => Math.round(aVal * 0.55 + bVal * 0.45);
  const toHex = (val) => val.toString(16).padStart(2, '0');
  return `#${toHex(blend(a.r, b.r))}${toHex(blend(a.g, b.g))}${toHex(blend(a.b, b.b))}`;
};

const vibeThemes = {
  mall: {
    accent: '#ff66c4',
    className: 'vibe-mall',
    ticker: 'Dialed into mall fountain acoustics. Glitter levels nominal.',
  },
  cable: {
    accent: '#7ee1ff',
    className: 'vibe-cable',
    ticker: 'Tonight on Channel 25: stop-motion elves, toy commercials, and cocoa refills.',
  },
  snowed: {
    accent: '#13c2ff',
    className: 'vibe-snowed',
    ticker: 'LAN party in the blizzard bunker. Dial-up tones approved by Santa HQ.',
  },
};

const vibeClasses = Object.values(vibeThemes).map((v) => v.className);
let activeVibe = 'mall';
let currentGame = 'snow';
let hasEnteredArcade = false;

const hideTreeForArcade = () => {
  dom.body.classList.add('tree-hidden');
  dom.treeReturnBtn?.removeAttribute('hidden');
};

const showTreeView = () => {
  dom.body.classList.remove('tree-hidden');
  dom.treeReturnBtn?.setAttribute('hidden', '');
  dom.treeWrap?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => dom.treeSpace?.focus({ preventScroll: true }), 300);
};

const enterArcade = () => {
  if (hasEnteredArcade) return;
  hasEnteredArcade = true;
  dom.body.classList.remove('home-mode');
  setTimeout(() => dom.gamePanel?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
};

const applyAccent = () => {
  const vibeAccent = vibeThemes[activeVibe]?.accent;
  const gameAccent = accentMap[currentGame] || '#39ff14';
  const mixedAccent = vibeAccent ? mixColors(gameAccent, vibeAccent) : gameAccent;
  setAccent(mixedAccent);
};

const activateGame = (id) => {
  cleanupTimers();
  dom.ornaments.forEach((o) => o.classList.toggle('active', o.dataset.id === id));
  currentGame = id;
  applyAccent();
  controllers[id]?.render();
};

const initArcadeVibes = () => {
  const cheerRange = document.getElementById('cheerRange');
  const cheerOutput = document.getElementById('cheerOutput');
  const ticker = document.getElementById('arcadeTicker');
  const vibeButtons = Array.from(document.querySelectorAll('.vibe-btn'));

  if (!cheerRange || !cheerOutput || !ticker) return;

  const updateCheer = (value) => {
    dom.root.style.setProperty('--cheer-heat', `${value}px`);
    if (value >= 28) {
      cheerOutput.textContent = 'TV Special Takeover';
    } else if (value >= 18) {
      cheerOutput.textContent = 'Mall Santa Mode';
    } else {
      cheerOutput.textContent = 'Cozy Living Room';
    }
  };

  const applyVibe = (vibeId) => {
    const theme = vibeThemes[vibeId];
    if (!theme) return;
    activeVibe = vibeId;
    dom.body.classList.remove(...vibeClasses);
    dom.body.classList.add(theme.className);
    ticker.textContent = theme.ticker;
    vibeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.vibe === vibeId));
    applyAccent();
  };

  vibeButtons.forEach((btn) => btn.addEventListener('click', () => applyVibe(btn.dataset.vibe)));
  cheerRange.addEventListener('input', (e) => updateCheer(Number(e.target.value)));

  updateCheer(Number(cheerRange.value));
  applyVibe(activeVibe);
};

const initInteractions = () => {
  wireOrnamentAccessibility((id) => {
    enterArcade();
    hideTreeForArcade();
    activateGame(id);
  });
  initParallax();
  initKonami();
  initScreenshot();
  initArcadeVibes();
  dom.treeReturnBtn?.addEventListener('click', showTreeView);
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
