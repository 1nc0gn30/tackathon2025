import { dom } from '../utils/dom.js';
import { cleanupTimers } from '../utils/state.js';

const doughOptions = [
  { id: 'ginger', label: 'Gingerbread', note: 'Classic spice', emoji: '🎄' },
  { id: 'sugar', label: 'Sugar cookie', note: 'Frosting ready', emoji: '⭐' },
  { id: 'peppermint', label: 'Peppermint', note: 'Cool crunch', emoji: '🍬' },
];

const frostingOptions = [
  { id: 'vanilla', label: 'Vanilla glaze', color: '#f6e7d8' },
  { id: 'chocolate', label: 'Cocoa dip', color: '#3b2514' },
  { id: 'berry', label: 'Berry neon', color: '#ff7ad1' },
];

const toppingOptions = [
  { id: 'sprinkles', label: 'Rainbow sprinkles' },
  { id: 'crunch', label: 'Crispy crunch' },
  { id: 'stars', label: 'Sugar stars' },
];

const createOptionButtons = (groupName, options, onChange) => {
  const fragment = document.createDocumentFragment();
  options.forEach((option) => {
    const btn = document.createElement('button');
    btn.className = 'cookie-token';
    btn.type = 'button';
    btn.dataset.value = option.id;
    btn.innerHTML = `${option.emoji || ''}<strong>${option.label}</strong><small>${option.note || ''}</small>`;
    btn.addEventListener('click', () => onChange(option.id));
    fragment.appendChild(btn);
  });
  return fragment;
};

export const CookieCrafter = {
  render() {
    dom.gameArea.innerHTML = `
      <div class="status" aria-label="Cookie Crafter status">
        <span aria-hidden="true">🍪</span><strong>Cookie Crafter</strong>
        <span class="pill">Build a perfect festival cookie</span>
      </div>
      <div class="cookie-board">
        <div class="cookie-preview" id="cookiePreview" aria-live="polite">
          <p class="badge">Fresh dough ready</p>
          <div class="cookie-shape">
            <div class="cookie-frosting"></div>
            <div class="cookie-topping"></div>
          </div>
          <p class="muted" id="cookieStatus">Gingerbread base • Vanilla glaze • Rainbow sprinkles</p>
        </div>
        <div class="cookie-controls">
          <div>
            <p class="eyebrow">Dough</p>
            <div class="cookie-options" id="doughOptions"></div>
          </div>
          <div>
            <p class="eyebrow">Frosting</p>
            <div class="cookie-options" id="frostingOptions"></div>
          </div>
          <div>
            <p class="eyebrow">Toppings</p>
            <div class="cookie-options" id="toppingOptions"></div>
          </div>
          <div class="cookie-actions">
            <button class="action loud" id="bakeBtn">Bake this cookie</button>
            <button class="action" id="surpriseBtn">Chef's surprise</button>
          </div>
        </div>
      </div>
      <div class="cookie-feed" id="cookieFeed" aria-live="polite">
        <p class="muted">No cookies baked yet. Start crafting to fill the plate.</p>
      </div>
    `;

    const preview = dom.gameArea.querySelector('#cookiePreview');
    const frostingLayer = preview.querySelector('.cookie-frosting');
    const toppingLayer = preview.querySelector('.cookie-topping');
    const status = dom.gameArea.querySelector('#cookieStatus');
    const feed = dom.gameArea.querySelector('#cookieFeed');

    const selection = {
      dough: doughOptions[0].id,
      frosting: frostingOptions[0].id,
      topping: toppingOptions[0].id,
    };

    const applyActive = (container, value) => {
      container.querySelectorAll('.cookie-token').forEach((btn) => btn.classList.toggle('active', btn.dataset.value === value));
    };

    const describeSelection = () => {
      const dough = doughOptions.find((d) => d.id === selection.dough)?.label;
      const frosting = frostingOptions.find((f) => f.id === selection.frosting)?.label;
      const topping = toppingOptions.find((t) => t.id === selection.topping)?.label;
      return `${dough} • ${frosting} • ${topping}`;
    };

    const updatePreview = () => {
      const frosting = frostingOptions.find((f) => f.id === selection.frosting);
      frostingLayer.style.background = frosting?.color || '#f6e7d8';
      toppingLayer.textContent = toppingOptions.find((t) => t.id === selection.topping)?.label || '';
      status.textContent = describeSelection();
      preview.classList.add('pulse');
      setTimeout(() => preview.classList.remove('pulse'), 400);
    };

    const attachOptions = (id, options, key) => {
      const container = dom.gameArea.querySelector(id);
      if (!container) return;
      const fragment = createOptionButtons(key, options, (value) => {
        selection[key] = value;
        applyActive(container, value);
        updatePreview();
      });
      container.innerHTML = '';
      container.appendChild(fragment);
      applyActive(container, selection[key]);
    };

    const addToFeed = (reason) => {
      const entry = document.createElement('div');
      entry.className = 'cookie-entry';
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      entry.innerHTML = `
        <span class="pill tiny">${time}</span>
        <div>
          <strong>${reason}</strong>
          <p class="muted">${describeSelection()}</p>
        </div>
      `;
      feed.querySelector('p')?.remove();
      feed.prepend(entry);
    };

    attachOptions('#doughOptions', doughOptions, 'dough');
    attachOptions('#frostingOptions', frostingOptions, 'frosting');
    attachOptions('#toppingOptions', toppingOptions, 'topping');
    updatePreview();

    dom.gameArea.querySelector('#bakeBtn')?.addEventListener('click', () => {
      addToFeed('Cookie baked and plated');
    });

    dom.gameArea.querySelector('#surpriseBtn')?.addEventListener('click', () => {
      const randomize = (options, key) => {
        const option = options[Math.floor(Math.random() * options.length)];
        selection[key] = option.id;
        attachOptions(`#${key}Options`, options, key);
      };
      randomize(doughOptions, 'dough');
      randomize(frostingOptions, 'frosting');
      randomize(toppingOptions, 'topping');
      updatePreview();
      addToFeed('Chef surprise cookie ready');
    });
  },
  destroy() {
    cleanupTimers();
  },
};
