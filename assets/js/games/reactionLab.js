import { cleanupTimers, state } from '../utils/state.js';
import { dom } from '../utils/dom.js';

export const ReactionLab = {
  render() {
    dom.gameArea.innerHTML = `
      <div class="react-lab" aria-label="Reaction lab status">
        <header>
          <div>
            <div class="react-eyebrow">Reflex / Elf Mode</div>
            <h3>Elf Reaction Lab</h3>
            <p class="muted">Tap when the neon orb flips to GO. Arm often, chase streaks.</p>
          </div>
          <div class="chip-row">
            <span class="pill" id="reactBest">Best: --</span>
            <span class="pill" id="reactStreak">Streak: 0</span>
          </div>
        </header>
        <div class="react-grid">
          <div class="reaction-visual">
            <div class="reaction-rings" aria-hidden="true"><span></span><span></span><span></span></div>
            <div class="lamp-badge" id="reactCoach">Calibrate your reflex</div>
            <div class="reaction-lamp" id="lamp" role="button" aria-label="Reaction lamp">READY?</div>
          </div>
          <div class="reaction-meta">
            <div class="reaction-feed mono" id="reactLog">Prep your clicking finger...</div>
            <div class="reaction-history" id="reactHistory" aria-live="polite"></div>
            <div class="control-row tight">
              <button class="action" id="reactBtn">ARM &amp; GLOW</button>
              <button class="action" id="reactAuto">Auto-loop off</button>
              <button class="action" id="reactReset">RESET BEST</button>
            </div>
          </div>
        </div>
      </div>
    `;

    let lamp = document.getElementById('lamp');
    let log = document.getElementById('reactLog');
    const bestEl = document.getElementById('reactBest');
    const streakEl = document.getElementById('reactStreak');
    const historyEl = document.getElementById('reactHistory');
    const coachEl = document.getElementById('reactCoach');
    const autoBtn = document.getElementById('reactAuto');
    let ready = false;
    let startTime = 0;
    let streak = state.reactionStreak || 0;
    let history = [];
    let autoLoop = false;

    const resetBest = () => {
      state.bestReaction = null;
      bestEl.textContent = 'Best: --';
      log.textContent = 'Prep your clicking finger...';
      streak = 0;
      state.reactionStreak = 0;
      streakEl.textContent = 'Streak: 0';
      history = [];
      historyEl.innerHTML = '';
      coachEl.textContent = 'Reset! Find your favorite rhythm.';
    };

    const refreshHistory = () => {
      historyEl.innerHTML = history
        .slice(-4)
        .reverse()
        .map(
          (item) => `
            <div class="reaction-chip">
              <strong>${item.ms}ms</strong>
              <span>${item.note}</span>
            </div>
          `
        )
        .join('');
    };

    const updateCoach = (text) => {
      coachEl.textContent = text;
    };

    const handleTap = () => {
      if (!ready) {
        log.textContent = 'Too early! The elves giggle.';
        updateCoach('Breathe. Arm, wait for GO, then strike.');
        return;
      }
      const ms = Math.round(performance.now() - startTime);
      const mood = ms < 250 ? '🎁 Lightning Elf!' : ms < 400 ? '🌟 Solid!' : '😴 Sleepy Santa...';
      log.textContent = `Reaction: ${ms}ms — ${mood}`;
      lamp.textContent = `${ms}ms`;
      lamp.style.background = 'radial-gradient(circle at 30% 30%, rgba(0, 255, 136, 0.35), rgba(0, 60, 33, 0.65))';
      streak = ms < 420 ? streak + 1 : 0;
      state.reactionStreak = streak;
      streakEl.textContent = `Streak: ${streak}`;
      history.push({ ms, note: mood });
      refreshHistory();
      updateCoach(streak > 3 ? '🔥 Streaking! Keep the flow.' : 'Nice pull. Arm again to climb streaks.');
      if (!state.bestReaction || ms < state.bestReaction) {
        state.bestReaction = ms;
        bestEl.textContent = `Best: ${ms}ms`;
        coachEl.textContent = 'New PR! Elves log the glow.';
      }
      ready = false;
      if (autoLoop) {
        setTimeout(() => armLasers(true), 800);
      }
    };

    const armLasers = (auto = false) => {
      cleanupTimers();
      lamp.textContent = 'WAIT';
      lamp.style.background = '#440044';
      lamp.style.color = '#ffe9ff';
      log.textContent = auto ? 'Auto-loop primed...' : 'Holding...';
      updateCoach('Hold steady. The orb will flip soon.');
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
    streakEl.textContent = `Streak: ${streak}`;
    document.getElementById('reactBtn').addEventListener('click', armLasers);
    document.getElementById('reactReset').addEventListener('click', resetBest);
    autoBtn.addEventListener('click', () => {
      autoLoop = !autoLoop;
      autoBtn.textContent = autoLoop ? 'Auto-loop on' : 'Auto-loop off';
      autoBtn.classList.toggle('loud', autoLoop);
    });
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
