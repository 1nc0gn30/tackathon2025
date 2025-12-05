import { dom } from '../utils/dom.js';
import { state } from '../utils/state.js';

let snowInterval;

const makeFlake = (intense) => {
  const flake = document.createElement('div');
  flake.className = 'snowflake';
  flake.textContent = '✻';
  flake.style.left = Math.random() * 100 + '%';
  flake.style.animationDuration = 7 + Math.random() * 6 + 's';
  flake.style.fontSize = 12 + Math.random() * 10 + 'px';
  flake.style.opacity = intense ? 0.8 : 0.55;
  dom.snowfallLayer.appendChild(flake);
  setTimeout(() => flake.remove(), 12000);
};

export const startSnowfall = (intense = false) => {
  if (!state.preferences.snowfall || state.preferences.reducedMotion) return;
  dom.snowfallLayer.style.opacity = intense ? 1 : 0.75;
  const maxFlakes = intense ? 24 : 14;
  if (snowInterval) clearInterval(snowInterval);
  snowInterval = setInterval(() => makeFlake(intense), 600 / maxFlakes);
};

export const stopSnowfall = () => {
  dom.snowfallLayer.style.opacity = 0;
  dom.snowfallLayer.innerHTML = '';
  if (snowInterval) clearInterval(snowInterval);
};
