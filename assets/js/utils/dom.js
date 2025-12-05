export const dom = {
  body: document.body,
  root: document.documentElement,
  ornaments: Array.from(document.querySelectorAll('.ornament')),
  gameArea: document.getElementById('gameArea'),
  gamePanel: document.getElementById('gamePanel'),
  postcardBtn: document.getElementById('postcardBtn'),
  snowfallLayer: document.getElementById('snowfallLayer'),
  treeSpace: document.querySelector('.tree-space'),
  tree: document.querySelector('.tree'),
  settingsPanel: document.getElementById('settingsPanel'),
  settingsToggle: document.getElementById('settingsToggle'),
  webglCanvas: document.getElementById('webglCanvas'),
  konamiStatus: document.getElementById('konamiStatus'),
  konamiBadge: document.getElementById('konamiBadge'),
};

export const setAccent = (color) => {
  dom.root.style.setProperty('--active-accent', color);
  dom.root.style.setProperty('--glow-green', color);
};
