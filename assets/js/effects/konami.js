import { state } from '../utils/state.js';
import { dom } from '../utils/dom.js';
import { startSnowfall } from './snowfall.js';

const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

const playJingle = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.15, now + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.3);
  });
};

const triggerKonami = () => {
  startSnowfall(true);
  dom.body.classList.add('ultimate-1997');
  playJingle();
  const originalBackground = dom.body.style.background;
  dom.body.dataset.konamiBg = originalBackground;
};

export const initKonami = () => {
  window.addEventListener('keydown', (e) => {
    state.konamiBuffer.push(e.key);
    if (state.konamiBuffer.length > konamiSequence.length) state.konamiBuffer.shift();
    if (konamiSequence.every((key, idx) => state.konamiBuffer[idx] === key)) {
      triggerKonami();
    }
  });
};
