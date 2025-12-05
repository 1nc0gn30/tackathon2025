import { dom } from '../utils/dom.js';
import { movies } from '../data/catalog.js';
import { openSelectionModal } from '../utils/modal.js';

export const RetroTheater = {
  render() {
    dom.gameArea.innerHTML = `
      <div class="status" aria-label="Retro movie theater">
        <span aria-hidden="true">🍿</span><strong>North Pole Cinema</strong>
      </div>
      <p>Slide into plush seats, grab a virtual popcorn, and play 1990s Christmas favorites without leaving the CRT glow. The screen has its own lane on desktop now — no more overflow.</p>
      <div class="theater-grid">
        <div class="theater-screen">
          <div class="curtain" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <div class="control-row">
            <button class="action" id="chooseMovie">Choose videos</button>
            <span class="pill">Scrollable catalog with search + categories.</span>
          </div>
          <div class="movie-frame" id="movieFrame"></div>
          <div class="popcorn" id="movieStatus">🍿 Front-row tip: videos open inline so you can keep swapping VHS picks.</div>
        </div>
        <div class="movie-grid" id="movieGrid"></div>
      </div>
    `;

    const frame = document.getElementById('movieFrame');
    const grid = document.getElementById('movieGrid');
    const chooseMovie = document.getElementById('chooseMovie');
    const movieStatus = document.getElementById('movieStatus');

    const playMovie = (movie) => {
      frame.innerHTML = `<iframe width="100%" height="100%" src="${movie.embed}" title="Movie screen" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      movieStatus.textContent = `🍿 Now showing: ${movie.title} (${movie.vibe}) — ${movie.runtime}`;
    };

    chooseMovie.addEventListener('click', () => {
      openSelectionModal({
        title: 'Holiday VHS library',
        description: 'Search and filter flicks',
        items: movies,
        categoryKey: 'category',
        onSelect: playMovie,
        renderMeta: (movie) => `<div class="meta">${movie.vibe} • ${movie.runtime}</div><div class="meta">${movie.note}</div>`,
      });
    });

    movies.forEach((movie, idx) => {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.innerHTML = `
        <h4>${movie.title}</h4>
        <div class="meta">${movie.vibe} • ${movie.runtime}</div>
        <div class="meta">${movie.note}</div>
        <div class="track-actions">
          <button class="action" data-embed="${movie.embed}">Project on screen ▶️</button>
          <a href="${movie.youtube}" target="_blank" rel="noopener">Watch on YouTube ↗</a>
        </div>
      `;

      card.querySelector('button').addEventListener('click', (e) => {
        const src = e.currentTarget.getAttribute('data-embed');
        playMovie({ ...movie, embed: src });
      });

      if (idx === 0) {
        playMovie(movie);
      }

      grid.appendChild(card);
    });
  },
};
