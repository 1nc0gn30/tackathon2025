import { dom } from './dom.js';

export const openSelectionModal = ({ title, description, items, onSelect, categoryKey = 'category', renderMeta }) => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const categories = ['all', ...new Set(items.map((item) => item[categoryKey] || 'other'))];

  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="modal-header">
        <div>
          <div class="pill tiny">${description}</div>
          <h3>${title}</h3>
          <p class="muted">Search, filter by vibe, then launch your pick.</p>
        </div>
        <button class="close-modal" aria-label="Close chooser">✖</button>
      </div>
      <div class="modal-tools">
        <input class="modal-search" type="search" placeholder="Search titles, artists, vibes" aria-label="Search options" />
        <div class="chip-row" role="list"></div>
      </div>
      <div class="modal-list" role="list"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  const list = overlay.querySelector('.modal-list');
  const search = overlay.querySelector('.modal-search');
  const chipRow = overlay.querySelector('.chip-row');
  let activeCategory = 'all';

  categories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.className = `chip ${cat === 'all' ? 'active' : ''}`;
    chip.textContent = cat === 'all' ? 'All vibes' : cat;
    chip.dataset.category = cat;
    chipRow.appendChild(chip);
  });

  const close = () => overlay.remove();

  const filterItems = () => {
    const query = search.value.toLowerCase();
    return items.filter((item) => {
      const matchesCategory = activeCategory === 'all' || (item[categoryKey] || 'other') === activeCategory;
      const haystack = JSON.stringify(item).toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      return matchesCategory && matchesSearch;
    });
  };

  const renderList = () => {
    const filtered = filterItems();
    list.innerHTML = filtered
      .map(
        (item, idx) => `
          <button class="modal-card" data-idx="${idx}" role="listitem">
            <div><strong>${item.title || item.name}</strong></div>
            ${item.artist ? `<div class="meta">${item.artist} • ${item.year}</div>` : ''}
            ${renderMeta ? renderMeta(item) : ''}
            <span class="pill tiny">${item[categoryKey] || 'other'}</span>
          </button>
        `
      )
      .join('');
  };

  renderList();

  chipRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    activeCategory = btn.dataset.category;
    chipRow.querySelectorAll('.chip').forEach((chip) => chip.classList.toggle('active', chip === btn));
    renderList();
  });

  search.addEventListener('input', renderList);

  list.addEventListener('click', (e) => {
    const card = e.target.closest('.modal-card');
    if (!card) return;
    const idx = Number(card.getAttribute('data-idx'));
    const filtered = filterItems();
    const item = filtered[idx];
    onSelect(item);
    close();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('close-modal')) close();
  });
};
