import { dom } from '../utils/dom.js';
import { state } from '../utils/state.js';

export const initParallax = () => {
  const handleTilt = (event) => {
    if (state.preferences.reducedMotion) return;
    if (state.parallaxFrame) cancelAnimationFrame(state.parallaxFrame);
    state.parallaxFrame = requestAnimationFrame(() => {
      const rect = dom.treeSpace.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
      dom.treeSpace.style.setProperty('--tilt-x', `${x}px`);
      dom.treeSpace.style.setProperty('--tilt-y', `${y}px`);
      dom.tree.style.transform = `rotateX(${y / 3}deg) rotateY(${x / 3}deg)`;
    });
  };

  dom.treeSpace.addEventListener('pointermove', handleTilt);
  dom.treeSpace.addEventListener('pointerleave', () => {
    dom.treeSpace.style.removeProperty('--tilt-x');
    dom.treeSpace.style.removeProperty('--tilt-y');
    dom.tree.style.transform = 'none';
  });
};
