import { dom, setAccent } from './dom.js';
import { state, persistPreferences } from './state.js';

const applyContrast = (enabled) => {
  dom.body.style.filter = enabled ? 'saturate(1.2) contrast(1.05)' : '';
  dom.root.style.setProperty('--panel', enabled ? 'rgba(0, 6, 12, 0.86)' : 'rgba(8, 10, 18, 0.82)');
};

export const initSettings = ({ onSnowToggle, onWebglToggle, onMotionToggle }) => {
  const { preferences } = state;
  const webglToggle = document.getElementById('webglToggle');
  const snowToggle = document.getElementById('snowToggle');
  const motionToggle = document.getElementById('motionToggle');
  const contrastToggle = document.getElementById('contrastToggle');

  const closePanel = () => {
    dom.controlCenter.classList.remove('is-open');
    dom.settingsPanel.setAttribute('hidden', '');
    dom.settingsToggle.setAttribute('aria-expanded', 'false');
  };

  const openPanel = () => {
    dom.controlCenter.classList.add('is-open');
    dom.settingsPanel.removeAttribute('hidden');
    dom.settingsToggle.setAttribute('aria-expanded', 'true');
    dom.settingsPanel.focus();
  };

  const sync = () => {
    webglToggle.checked = preferences.webgl;
    snowToggle.checked = preferences.snowfall;
    motionToggle.checked = preferences.reducedMotion;
    contrastToggle.checked = preferences.highContrast;
    applyContrast(preferences.highContrast);
  };

  sync();

  dom.settingsToggle.addEventListener('click', () => {
    const open = !dom.controlCenter.classList.contains('is-open');
    if (open) openPanel();
    else closePanel();
  });

  dom.settingsClose?.addEventListener('click', closePanel);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dom.controlCenter.classList.contains('is-open')) {
      closePanel();
      dom.settingsToggle.focus({ preventScroll: true });
    }
  });

  webglToggle.addEventListener('change', () => {
    preferences.webgl = webglToggle.checked;
    persistPreferences();
    onWebglToggle(preferences.webgl);
  });

  snowToggle.addEventListener('change', () => {
    preferences.snowfall = snowToggle.checked;
    persistPreferences();
    onSnowToggle(preferences.snowfall);
  });

  motionToggle.addEventListener('change', () => {
    preferences.reducedMotion = motionToggle.checked;
    persistPreferences();
    onMotionToggle(preferences.reducedMotion);
  });

  contrastToggle.addEventListener('change', () => {
    preferences.highContrast = contrastToggle.checked;
    persistPreferences();
    applyContrast(preferences.highContrast);
  });
};
