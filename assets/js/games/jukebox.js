import { dom } from '../utils/dom.js';
import { vibes, tracks } from '../data/catalog.js';
import { openSelectionModal } from '../utils/modal.js';

export const Jukebox = {
  render() {
    dom.gameArea.innerHTML = `
      <div class="status" aria-label="Jukebox status">
        <span aria-hidden="true">🎶</span><strong>Jingle Jukebox</strong>
      </div>
      <p>Pick a vibe and the whole background morphs like a GIF from 1997. Queue up the most 90s holiday bops, then keep the player docked neatly in its own bay.</p>
      <div class="jukebox-header">
        <div class="jukebox-meta">
          <div class="jukebox-preview" id="jukeboxPreview" aria-label="Background preview"></div>
          <div class="now-playing" id="nowPlaying">Select a track to start the party.<small>Inline player keeps the vibes while you browse.</small></div>
          <div class="control-row">
            <button class="action" id="chooseTrack">Choose songs</button>
            <button class="action" id="shuffleJukebox">SHUFFLE VIBE</button>
            <span class="pill">Changes also tint the tree lights ✨</span>
          </div>
          <div class="player-shell">
            <div class="pill" id="playerStatus">Current video appears here when you pick a track.</div>
            <div class="player-frame" id="playerFrame"></div>
          </div>
        </div>
        <div class="player-shell screen-shell">
          <div class="pill">Mood palette</div>
          <div class="jukebox" id="jukeboxGrid"></div>
        </div>
      </div>
      <div class="tracklist" id="trackList"></div>
      <div class="mono" id="jukeboxLog">Pro tip: stack vibes for maximum chaos — or open the chooser to jump right to a favorite.</div>
    `;

    const grid = document.getElementById('jukeboxGrid');
    const log = document.getElementById('jukeboxLog');
    const shuffle = document.getElementById('shuffleJukebox');
    const preview = document.getElementById('jukeboxPreview');
    const trackList = document.getElementById('trackList');
    const playerFrame = document.getElementById('playerFrame');
    const nowPlaying = document.getElementById('nowPlaying');
    const chooseTrack = document.getElementById('chooseTrack');
    const playerStatus = document.getElementById('playerStatus');

    preview.style.background = dom.body.style.background || vibes[0].bg;

    vibes.forEach((vibe) => {
      const card = document.createElement('button');
      card.className = 'action button-like';
      card.style.background = 'var(--active-accent)';
      card.style.color = '#120021';
      card.innerHTML = `<strong>${vibe.name}</strong><br><small>${vibe.note}</small>`;
      card.addEventListener('click', () => {
        dom.body.style.background = vibe.bg;
        preview.style.background = vibe.bg;
        log.textContent = `${vibe.name} engaged — backgrounds like it's 1997!`;
      });
      grid.appendChild(card);
    });

    shuffle.addEventListener('click', () => {
      const vibe = vibes[Math.floor(Math.random() * vibes.length)];
      dom.body.style.background = vibe.bg;
      preview.style.background = vibe.bg;
      log.textContent = `${vibe.name} shuffle drop — remixing the glow!`;
    });

    const playTrack = (track) => {
      playerFrame.innerHTML = `<iframe width="100%" height="100%" src="${track.embed}" title="YouTube player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      log.textContent = `Now streaming: ${track.title} — ${track.artist}`;
      nowPlaying.innerHTML = `${track.title}<small>${track.artist} • ${track.year}</small>`;
      playerStatus.textContent = 'Inline player anchored — keep browsing for more jingles!';
    };

    chooseTrack.addEventListener('click', () => {
      openSelectionModal({
        title: 'Jingle jukebox catalog',
        description: 'Swipe through 90s hits',
        items: tracks,
        categoryKey: 'category',
        onSelect: playTrack,
        renderMeta: (track) => `<div class="meta">${track.artist} • ${track.year}</div><div class="meta">${track.note}</div>`,
      });
    });

    tracks.forEach((track) => {
      const card = document.createElement('div');
      card.className = 'track-card';
      card.innerHTML = `
        <h4>${track.title}</h4>
        <div class="track-meta">${track.artist} • ${track.year}</div>
        <div class="track-meta">${track.note}</div>
        <div class="track-actions">
          <button class="action" data-embed="${track.embed}">Play inline ▶️</button>
          <a href="${track.youtube}" target="_blank" rel="noopener">Open on YouTube ↗</a>
        </div>
      `;

      card.querySelector('button').addEventListener('click', (e) => {
        const src = e.currentTarget.getAttribute('data-embed');
        playTrack({ ...track, embed: src });
      });

      trackList.appendChild(card);
    });
  },
};
