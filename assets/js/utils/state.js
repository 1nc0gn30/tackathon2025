const defaultPreferences = {
  snowfall: true,
  webgl: true,
  reducedMotion: false,
  highContrast: false,
};

const loadPreferences = () => {
  const raw = localStorage.getItem('tacky-settings');
  if (!raw) return { ...defaultPreferences };
  try {
    return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('Settings parse failed', err);
    return { ...defaultPreferences };
  }
};

export const state = {
  activeInterval: null,
  activeTimeout: null,
  bestReaction: null,
  snowTicker: [],
  konamiBuffer: [],
  parallaxFrame: null,
  lastLocationLabel: 'your spot',
  preferences: loadPreferences(),
};

export const cleanupTimers = () => {
  if (state.activeInterval) {
    clearInterval(state.activeInterval);
    state.activeInterval = null;
  }
  if (state.activeTimeout) {
    clearTimeout(state.activeTimeout);
    state.activeTimeout = null;
  }
};

export const persistPreferences = () => {
  localStorage.setItem('tacky-settings', JSON.stringify(state.preferences));
};
