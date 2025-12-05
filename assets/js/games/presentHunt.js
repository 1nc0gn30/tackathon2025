import { cleanupTimers, state } from '../utils/state.js';
import { dom } from '../utils/dom.js';

export const PresentHunt = {
  render() {
    dom.gameArea.innerHTML = `
      <div class="status" aria-label="Present hunt status">
        <span aria-hidden="true">🎁</span><strong>Present Radar</strong>
        <span class="pill" id="huntTimer">Timer: --</span>
      </div>
      <div class="control-row">
        <label for="huntDifficulty">Difficulty
          <select id="huntDifficulty" aria-label="Choose difficulty">
            <option value="easy">Easy (8s)</option>
            <option value="medium" selected>Medium (10s)</option>
            <option value="hard">Hard (12 gifts, 12s)</option>
          </select>
        </label>
        <button class="action" id="spawnBtn">SPAWN PRESENTS</button>
      </div>
      <div class="mono" id="huntLog">Click all the presents before they despawn.</div>
      <div class="hunt-field" id="huntField" role="region" aria-label="Present hunt field"></div>
    `;

    const presents = ['🎁', '🎀', '🧦', '🧸', '🍬', '🍭', '🎫'];
    const field = document.getElementById('huntField');
    const log = document.getElementById('huntLog');
    const timerEl = document.getElementById('huntTimer');
    const difficulty = document.getElementById('huntDifficulty');

    const handleGiftClick = (gift, total, found, start) => {
      gift.remove();
      const elapsed = Math.round(performance.now() - start);
      log.textContent = `Collected ${found + 1}/${total} in ${elapsed}ms`;
    };

    const spawnRun = () => {
      field.innerHTML = '';
      cleanupTimers();
      let found = 0;
      const mode = difficulty.value;
      const timeLimit = mode === 'easy' ? 8000 : mode === 'hard' ? 12000 : 10000;
      const total = mode === 'hard' ? 12 : 6 + Math.floor(Math.random() * 4);
      const start = performance.now();
      timerEl.textContent = `Timer: ${(timeLimit / 1000).toFixed(0)}s`;

      for (let i = 0; i < total; i++) {
        const gift = document.createElement('span');
        gift.textContent = presents[Math.floor(Math.random() * presents.length)];
        gift.className = 'present';
        gift.tabIndex = 0;
        gift.style.left = Math.random() * 88 + '%';
        gift.style.top = Math.random() * 82 + '%';
        gift.setAttribute('role', 'button');
        gift.setAttribute('aria-label', `Gift ${i + 1} of ${total}`);
        const handleCollect = () => {
          handleGiftClick(gift, total, found, start);
          found++;
          if (found === total) {
            const elapsed = Math.round(performance.now() - start);
            log.textContent = `ALL PRESENTS SECURED in ${elapsed}ms — SLEIGH DEPLOYED!`;
            timerEl.textContent = 'Timer: cleared!';
            cleanupTimers();
          }
        };
        gift.addEventListener('click', handleCollect);
        gift.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCollect();
          }
        });
        field.appendChild(gift);
      }

      state.activeInterval = setInterval(() => {
        const remaining = Math.max(0, timeLimit - (performance.now() - start));
        timerEl.textContent = `Timer: ${(remaining / 1000).toFixed(1)}s`;
        if (remaining <= 0) {
          clearInterval(state.activeInterval);
          state.activeInterval = null;
          if (field.children.length > 0) {
            log.textContent = "Time's up! The sleigh zoomed away.";
            field.innerHTML = '';
          }
        }
      }, 120);

      state.activeTimeout = setTimeout(() => {
        if (field.children.length > 0) {
          log.textContent = "Time's up! The sleigh zoomed away.";
          field.innerHTML = '';
        }
      }, timeLimit);
    };

    document.getElementById('spawnBtn').addEventListener('click', spawnRun);
  },
};
