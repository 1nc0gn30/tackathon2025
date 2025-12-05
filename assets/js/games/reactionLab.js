import { cleanupTimers, state } from '../utils/state.js';
import { dom } from '../utils/dom.js';

export const ReactionLab = {
  render() {
    dom.gameArea.innerHTML = `
      <div class="status" aria-label="Reaction lab status">
        <span aria-hidden="true">🎄</span><strong>Elf Reaction Lab</strong>
        <span class="pill" id="reactBest">Best: --</span>
      </div>
      <div class="reaction-lamp" id="lamp" role="button" aria-label="Reaction lamp">READY?</div>
      <div class="control-row">
        <button class="action" id="reactBtn">ARM THE LASERS</button>
        <button class="action" id="reactReset">RESET BEST</button>
      </div>
      <div class="mono" id="reactLog">Prep your clicking finger...</div>
    `;

    let lamp = document.getElementById('lamp');
    let log = document.getElementById('reactLog');
    const bestEl = document.getElementById('reactBest');
    let ready = false;
    let startTime = 0;

    const resetBest = () => {
      state.bestReaction = null;
      bestEl.textContent = 'Best: --';
      log.textContent = 'Prep your clicking finger...';
    };

    const handleTap = () => {
      if (!ready) {
        log.textContent = 'Too early! The elves giggle.';
        return;
      }
      const ms = Math.round(performance.now() - startTime);
      const mood = ms < 250 ? '🎁 Lightning Elf!' : ms < 400 ? '🌟 Solid!' : '😴 Sleepy Santa...';
      log.textContent = `Reaction: ${ms}ms — ${mood}`;
      lamp.textContent = `${ms}ms`;
      if (!state.bestReaction || ms < state.bestReaction) {
        state.bestReaction = ms;
        bestEl.textContent = `Best: ${ms}ms`;
      }
      ready = false;
    };

    const armLasers = () => {
      cleanupTimers();
      lamp.textContent = 'WAIT';
      lamp.style.background = '#440044';
      lamp.style.color = '#ffe9ff';
      log.textContent = 'Holding...';
      ready = false;

      state.activeTimeout = setTimeout(() => {
        ready = true;
        lamp.textContent = 'GO!';
        lamp.style.background = '#00ff88';
        lamp.style.color = '#002b10';
        startTime = performance.now();
      }, 1200 + Math.random() * 1800);
    };

    bestEl.textContent = `Best: ${state.bestReaction ? state.bestReaction + 'ms' : '--'}`;
    document.getElementById('reactBtn').addEventListener('click', armLasers);
    document.getElementById('reactReset').addEventListener('click', resetBest);
    lamp.addEventListener('click', handleTap);
    lamp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleTap();
      }
    });
    lamp.tabIndex = 0;
  },
};
