import { dom, setAccent } from './utils/dom.js';
import { state, cleanupTimers } from './utils/state.js';
import { wireOrnamentAccessibility } from './utils/accessibility.js';
import { initParallax } from './effects/parallax.js';
import { initKonami } from './effects/konami.js';
import { startSnowfall, stopSnowfall } from './effects/snowfall.js';
import { initGlow, stopGlow } from './effects/webglGlow.js';
import { initThreeScene, stopThreeScene } from './effects/threeScene.js';
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

const gameThemes = {
  snow: 'game-theme-snow',
  react: 'game-theme-react',
  hunt: 'game-theme-hunt',
  jukebox: 'game-theme-jukebox',
  theater: 'game-theme-theater',
  santa: 'game-theme-santa',
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
    label: 'Mall Santa Mix',
  },
  cable: {
    accent: '#7ee1ff',
    className: 'vibe-cable',
    ticker: 'Tonight on Channel 25: stop-motion elves, toy commercials, and cocoa refills.',
    label: 'Cable Special',
  },
  snowed: {
    accent: '#13c2ff',
    className: 'vibe-snowed',
    ticker: 'LAN party in the blizzard bunker. Dial-up tones approved by Santa HQ.',
    label: 'Blizzard LAN Party',
  },
};

const vibeClasses = Object.values(vibeThemes).map((v) => v.className);
const gameThemeClasses = Object.values(gameThemes);
let activeVibe = 'mall';
let currentGame = null;
let hasEnteredArcade = false;
const defaultBackground = getComputedStyle(document.body).background;
const santaKey = 'tacky-santa-cookie';
let santaModal;

const gameLabels = {
  snow: 'Snow Console',
  react: 'Elf Reaction Lab',
  hunt: 'Present Hunt',
  jukebox: 'Jingle Jukebox',
  theater: 'Retro Theater',
  santa: 'Santa Tracker',
};

const haltActiveMedia = () => {
  if (dom.gameArea) {
    dom.gameArea.querySelectorAll('iframe').forEach((frame) => {
      frame.src = 'about:blank';
      frame.remove();
    });

    dom.gameArea.querySelectorAll('video, audio').forEach((media) => {
      media.pause?.();
      media.currentTime = 0;
      media.removeAttribute('src');
      media.load?.();
    });

    dom.gameArea.innerHTML = '';
  }

  document.querySelectorAll('.modal-overlay:not(.santa-modal)').forEach((overlay) => overlay.remove());
  dom.body.style.background = defaultBackground;
};

const hideTreeForArcade = () => {
  dom.body.classList.add('tree-hidden');
  dom.treeReturnBtn?.removeAttribute('hidden');
};

const showTreeView = () => {
  dom.body.classList.remove('tree-hidden');
  dom.body.classList.add('home-mode');
  haltActiveMedia();
  dom.body.classList.remove(...gameThemeClasses);
  hasEnteredArcade = false;
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
  if (dom.arcadeVibeStatus) {
    const label = vibeThemes[activeVibe]?.label || 'Arcade';
    dom.arcadeVibeStatus.textContent = `Vibe: ${label}`;
  }
};

const applyGameTheme = (id) => {
  dom.body.classList.remove(...gameThemeClasses);
  const className = gameThemes[id];
  if (className) {
    dom.body.classList.add(className);
  }
};

const activateGame = (id) => {
  if (currentGame && controllers[currentGame]?.destroy) {
    controllers[currentGame].destroy();
  }
  cleanupTimers();
  haltActiveMedia();
  dom.ornaments.forEach((o) => o.classList.toggle('active', o.dataset.id === id));
  currentGame = id;
  applyGameTheme(id);
  applyAccent();
  controllers[id]?.render();
  if (dom.arcadeNowPlaying) {
    dom.arcadeNowPlaying.textContent = `Now playing: ${gameLabels[id] || 'Elf Arcade'}`;
  }
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

const initArcadeHelpers = () => {
  dom.arcadeShuffle?.addEventListener('click', () => {
    const keys = Object.keys(controllers);
    const next = keys[Math.floor(Math.random() * keys.length)];
    enterArcade();
    hideTreeForArcade();
    activateGame(next);
  });

  dom.arcadeFocus?.addEventListener('click', () => {
    dom.gamePanel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    dom.gameArea?.focus({ preventScroll: true });
  });
};

const setSantaStatus = (answer) => {
  if (!dom.arcadeSantaStatus) return;
  if (answer === 'yes') {
    dom.arcadeSantaStatus.textContent = '🎅 Santa logged your cookies + milk. HO HO HO!';
  } else if (answer === 'no') {
    dom.arcadeSantaStatus.textContent = '😢 Santa is sad but respects your diet. Cookies pending.';
  } else {
    dom.arcadeSantaStatus.textContent = 'Santa has a cookie question…';
  }
};

const closeSantaModal = () => {
  santaModal?.remove();
  santaModal = null;
};

const handleSantaChoice = (answer) => {
  localStorage.setItem(santaKey, answer);
  setSantaStatus(answer);
  const reaction = answer === 'yes' ? 'Ho ho ho! Merry Christmas!' : 'Oh no! Santa will pout until cookies appear.';
  const emoji = answer === 'yes' ? '🎅✨' : '🎅🥺';
  const message = santaModal?.querySelector('.santa-line');
  if (message) {
    message.textContent = `${emoji} ${reaction}`;
  }
  setTimeout(closeSantaModal, 1400);
};

const initSantaPrompt = () => {
  const previous = localStorage.getItem(santaKey);
  setSantaStatus(previous);
  if (previous) return;

  setTimeout(() => {
    santaModal = document.createElement('div');
    santaModal.className = 'modal-overlay santa-modal';
    santaModal.innerHTML = `
      <div class="santa-card" role="dialog" aria-label="Santa cookie request" aria-modal="true">
        <div class="santa-top">
          <span class="santa-emoji" aria-hidden="true">🎅</span>
          <div>
            <p class="santa-title">Santa's Cookie Consent</p>
            <p class="santa-line">May Santa snag cookies & milk while you play?</p>
          </div>
          <button class="close-modal" aria-label="Dismiss Santa" id="santaClose">✕</button>
        </div>
        <div class="santa-actions">
          <button class="action" data-answer="no">No, sorry</button>
          <button class="action loud" data-answer="yes">Yes! Please</button>
        </div>
      </div>
    `;
    document.body.appendChild(santaModal);
    santaModal.querySelectorAll('[data-answer]').forEach((btn) =>
      btn.addEventListener('click', () => handleSantaChoice(btn.dataset.answer))
    );
    santaModal.querySelector('#santaClose')?.addEventListener('click', closeSantaModal);
  }, 1600);
};

const initTreeScene = () => {
  if (!dom.treeScene) return;

  const restartAnimation = (className, duration = 1400) => {
    dom.treeScene.classList.remove(className);
    void dom.treeScene.offsetWidth;
    dom.treeScene.classList.add(className);
    setTimeout(() => dom.treeScene?.classList.remove(className), duration);
  };

  dom.sceneSnowBtn?.addEventListener('click', () => restartAnimation('scene-burst', 1100));
  dom.sceneGlowBtn?.addEventListener('click', () => restartAnimation('scene-starlit', 1400));
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
  initArcadeHelpers();
  initTreeScene();
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
  initSantaPrompt();

  initSettings({
    onSnowToggle: (enabled) => {
      if (enabled) startSnowfall();
      else stopSnowfall();
    },
    onWebglToggle: (enabled) => {
      if (enabled) {
        initGlow();
        initThreeScene();
      } else {
        stopGlow();
        stopThreeScene();
      }
    },
    onMotionToggle: (reduced) => applyMotionPreference(reduced),
  });

  if (state.preferences.webgl) {
    initGlow();
    initThreeScene();
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
