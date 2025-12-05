import { dom } from './dom.js';

export const wireOrnamentAccessibility = (activateGame) => {
  dom.ornaments.forEach((ornament) => {
    ornament.setAttribute('role', 'button');
    ornament.tabIndex = 0;
    ornament.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        ornament.click();
      }
    });
    ornament.addEventListener('click', () => activateGame(ornament.dataset.id));
  });
};
