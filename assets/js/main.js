import { dom, setAccent } from './utils/dom.js';
import { state, cleanupTimers } from './utils/state.js';
import { wireOrnamentAccessibility } from './utils/accessibility.js';
import { initParallax } from './effects/parallax.js';
import { initKonami } from './effects/konami.js';
import { startSnowfall, stopSnowfall } from './effects/snowfall.js';
import { initGlow, stopGlow } from './effects/webglGlow.js';
import { initThreeScene, setThreeVisibility, stopThreeScene } from './effects/threeScene.js';
import { initScreenshot } from './utils/screenshot.js';
import { initSettings } from './utils/settings.js';
import { initElfGuide } from './effects/elfGuide.js';
import { SnowConsole } from './games/snowConsole.js';
import { ReactionLab } from './games/reactionLab.js';
import { PresentHunt } from './games/presentHunt.js';
import { Jukebox } from './games/jukebox.js';
import { RetroTheater } from './games/theater.js';
import { SantaTracker } from './games/santaTracker.js';
import { CookieCrafter } from './games/cookieCrafter.js';
import { ReindeerRally } from './games/reindeerRally.js';

const controllers = {
  snow: SnowConsole,
  react: ReactionLab,
  hunt: PresentHunt,
  jukebox: Jukebox,
  theater: RetroTheater,
  santa: SantaTracker,
  cookie: CookieCrafter,
  reindeer: ReindeerRally,
};

const accentMap = {
  snow: '#13c2ff',
  react: '#ff8bf0',
  hunt: '#39ff14',
  jukebox: '#ffb347',
  theater: '#ff718d',
  santa: '#ffc107',
  cookie: '#f5b46a',
  reindeer: '#9b7bff',
};

const gameThemes = {
  snow: 'game-theme-snow',
  react: 'game-theme-react',
  hunt: 'game-theme-hunt',
  jukebox: 'game-theme-jukebox',
  theater: 'game-theme-theater',
  santa: 'game-theme-santa',
  cookie: 'game-theme-cookie',
  reindeer: 'game-theme-reindeer',
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

const syncTreeReturnButton = () => {
  if (!dom.treeReturnBtn) return;
  const onTreePage = dom.body.classList.contains('home-mode') && !dom.body.classList.contains('tree-hidden');
  dom.treeReturnBtn.toggleAttribute('hidden', onTreePage);
};

const gameLabels = {
  snow: 'Snow Console',
  react: 'Elf Reaction Lab',
  hunt: 'Present Hunt',
  jukebox: 'Jingle Jukebox',
  theater: 'Retro Theater',
  santa: 'Santa Tracker',
  cookie: 'Cookie Crafter',
  reindeer: 'Reindeer Rally',
};

const tickerMessages = {
  snow: 'Snow console primed — live forecasts + 3D flakes.',
  react: 'Elf reaction lab glowing. Try the neon lamp!',
  hunt: 'Presents hidden everywhere. Keep the streak alive.',
  jukebox: 'Jukebox queued — swap cassettes and dance.',
  theater: 'Retro theater rolling film reels.',
  santa: 'Santa tracker online. Cookies logged.',
  cookie: 'Cookie Crafter ready. Stack frosting and sprinkles.',
  reindeer: 'Reindeer Rally scoreboard armed for speed.',
};

const arcadeLineup = [
  { id: 'snow', mood: 'Live', desc: 'Weather radar plus handmade flakes.' },
  { id: 'cookie', mood: 'New', desc: 'Design cookies and surprise Santa.' },
  { id: 'reindeer', mood: 'Arcade', desc: 'Race the herd with weather boosts.' },
  { id: 'react', mood: 'Neon', desc: 'Tap reactions and chase streaks.' },
  { id: 'hunt', mood: 'Quest', desc: 'Hunt gifts with a growing streak.' },
  { id: 'jukebox', mood: 'Mix', desc: 'VHS mixtape controls and vibes.' },
  { id: 'theater', mood: 'VHS', desc: 'Retro trailers and popcorn mode.' },
  { id: 'santa', mood: 'Classic', desc: 'Tracker with Santa cookie prompts.' },
};

const setArcadeTicker = (message) => {
  if (!dom.arcadeTicker) return;
  dom.arcadeTicker.textContent = message;
  dom.arcadeTicker.classList.remove('flash');
  void dom.arcadeTicker.offsetWidth;
  dom.arcadeTicker.classList.add('flash');
};

const setPlaylistActive = (id) => {
  if (!dom.playlistRail) return;
  dom.playlistRail.querySelectorAll('.playlist-card').forEach((card) => {
    card.classList.toggle('active', card.dataset.id === id);
  });
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
  syncTreeReturnButton();
};

const showTreeView = () => {
  dom.body.classList.remove('tree-hidden');
  dom.body.classList.add('home-mode');
  haltActiveMedia();
  dom.body.classList.remove(...gameThemeClasses);
  hasEnteredArcade = false;
  syncTreeReturnButton();
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
  setPlaylistActive(id);
  setArcadeTicker(tickerMessages[id] || 'Elf arcade online.');
};

const initArcadeVibes = () => {
  const cheerRange = document.getElementById('cheerRange');
  const cheerOutput = document.getElementById('cheerOutput');
  const ticker = document.getElementById('arcadeTicker');
  const vibeButtons = Array.from(document.querySelectorAll('.vibe-btn'));
  const cheerChip = dom.cheerStatusChip;

  if (!cheerRange || !cheerOutput || !ticker) return;

  const updateCheer = (value) => {
    dom.root.style.setProperty('--cheer-heat', `${value}px`);
    if (cheerChip) {
      cheerChip.textContent = `Cheer score: ${value}`;
    }
    if (value >= 28) {
      cheerOutput.textContent = 'TV Special Takeover';
      setArcadeTicker('Cheer peaked — TV Special Takeover unlocked.');
    } else if (value >= 18) {
      cheerOutput.textContent = 'Mall Santa Mode';
      setArcadeTicker('Cheer coasting in Mall Santa Mode.');
    } else {
      cheerOutput.textContent = 'Cozy Living Room';
      setArcadeTicker('Cozy vibes — arcade runs in chill mode.');
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
    setArcadeTicker(`Vibe changed to ${theme.label}.`);
  };

  vibeButtons.forEach((btn) => btn.addEventListener('click', () => applyVibe(btn.dataset.vibe)));
  cheerRange.addEventListener('input', (e) => updateCheer(Number(e.target.value)));

  updateCheer(Number(cheerRange.value));
  applyVibe(activeVibe);
};

const initArcadeHelpers = () => {
  const spotlight = () => {
    dom.gameArea?.classList.add('spotlit');
    setTimeout(() => dom.gameArea?.classList.remove('spotlit'), 800);
  };

  dom.arcadeShuffle?.addEventListener('click', () => {
    const keys = Object.keys(controllers);
    const next = keys[Math.floor(Math.random() * keys.length)];
    enterArcade();
    hideTreeForArcade();
    activateGame(next);
    setArcadeTicker(`Shuffled to ${gameLabels[next]}.`);
    spotlight();
  });

  dom.arcadeFocus?.addEventListener('click', () => {
    dom.gamePanel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    dom.gameArea?.focus({ preventScroll: true });
    spotlight();
    setArcadeTicker('Arcade centered. Controllers ready.');
  });
};

const initArcadePlaylist = () => {
  if (!dom.playlistRail) return;
  let lineup = [...arcadeLineup];

  const render = () => {
    dom.playlistRail.innerHTML = lineup
      .map(
        (item) => `
        <article class="playlist-card" data-id="${item.id}">
          <div>
            <p class="pill tiny">${item.mood}</p>
            <h4>${gameLabels[item.id]}</h4>
            <p class="muted">${item.desc}</p>
          </div>
          <div class="playlist-actions">
            <button class="action" data-start="${item.id}">Play</button>
          </div>
        </article>
      `
      )
      .join('');

    dom.playlistRail.querySelectorAll('[data-start]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.start;
        enterArcade();
        hideTreeForArcade();
        activateGame(id);
        setArcadeTicker(`${gameLabels[id]} beaming into the arcade.`);
      });
    });

    setPlaylistActive(currentGame);
  };

  dom.arcadeLineupRefresh?.addEventListener('click', () => {
    lineup.push(lineup.shift());
    lineup.push(lineup.shift());
    render();
    setArcadeTicker('Arcade lineup rotated. New picks up top.');
  });

  render();
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
  initArcadePlaylist();
  initTreeScene();
  dom.treeReturnBtn?.addEventListener('click', showTreeView);
};

const initThreeScrollReveal = () => {
  if (!dom.threeCanvas) return;
  let lastY = window.scrollY;
  let showing = false;

  const evaluate = () => {
    const currentY = window.scrollY;
    const delta = currentY - lastY;
    const shouldShow = delta > 8 && currentY > 16;
    const shouldHide = delta < -8 || currentY < 12;

    if (shouldShow && !showing) {
      showing = true;
      setThreeVisibility(true);
    } else if (shouldHide && showing) {
      showing = false;
      setThreeVisibility(false);
    }

    lastY = currentY;
  };

  window.addEventListener('scroll', () => requestAnimationFrame(evaluate));
  evaluate();
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
  initThreeScrollReveal();
  syncTreeReturnButton();

  initSettings({
    onSnowToggle: (enabled) => {
      if (enabled) startSnowfall();
      else stopSnowfall();
    },
    onWebglToggle: (enabled) => {
      if (enabled) {
        initGlow();
        initThreeScene();
        setThreeVisibility(false);
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
    setThreeVisibility(false);
  }
  if (state.preferences.snowfall) {
    startSnowfall();
  }
  if (state.preferences.reducedMotion) {
    applyMotionPreference(true);
  }

  dom.postcardBtn.setAttribute('aria-live', 'polite');
  activateGame('snow');
  initElfGuide();
};

document.addEventListener('DOMContentLoaded', boot);
