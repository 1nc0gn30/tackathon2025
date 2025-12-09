import { dom } from '../utils/dom.js';

let statusEl;
let routeEl;
let mapEl;
let metaEl;

const fallbackSanta = {
  location: 'North Pole Flight Path',
  country: 'Arctic Circle',
  lat: 64.7511,
  lon: -147.3494,
  speed: '760 km/h',
  population: 'Reindeer crew + elves',
  delivered: '4.2B gifts',
  status: 'Cruising between rooftops and cocoa stops',
  nextStops: [
    'Anchorage, Alaska',
    'Vancouver, Canada',
    'Seattle, USA',
    'Portland, USA',
  ],
};

const trackerLinks = [
  {
    name: 'NORAD Tracks Santa',
    url: 'https://www.noradsanta.org/',
    badge: 'Official radar',
    note: '3D globe + daily updates direct from NORAD.',
  },
  {
    name: 'Google Santa Tracker',
    url: 'https://santatracker.google.com/',
    badge: 'Games + live path',
    note: 'Interactive globe with elf mini-games.',
  },
  {
    name: 'Santa Update Radio',
    url: 'https://santaupdate.com/',
    badge: 'North Pole newsroom',
    note: 'Newsroom dispatches + Santa tracking audio.',
  },
  {
    name: 'Elf HQ Live Cam',
    url: 'https://northpole.com/',
    badge: 'Workshop cams',
    note: 'Elf plaza cams and countdown boards.',
  },
];

const noradFeedUrl = 'https://www.noradsanta.org/en/map';

const buildMap = (lat, lon) => {
  const bbox = `${lon - 1},${lat - 1},${lon + 1},${lat + 1}`;
  return `<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}" title="Santa tracker map" loading="lazy"></iframe>`;
};

const renderSanta = (santa, alertMessage) => {
  if (!statusEl || !routeEl || !mapEl || !metaEl) return;
  const headline = santa.location ? `${santa.location}${santa.country ? ` — ${santa.country}` : ''}` : 'Somewhere festive';

  statusEl.innerHTML = `
    <div class="ornament-hero">
      <div class="hero-icon" aria-hidden="true">🎅</div>
      <div>
        <strong>Santa Tracker</strong>
        <p class="muted">Live hop via Santa Tracker API (no sign-up). Updates show the latest known hop.</p>
      </div>
    </div>
    <div class="santa-alert" role="status">${alertMessage ? `Using backup data: ${alertMessage}` : 'Tracking data refreshed just now.'}</div>
  `;

  metaEl.innerHTML = `
    <div class="santa-meta">
      <div class="santa-pill"><strong>Current spot</strong><span>${headline}</span></div>
      <div class="santa-pill"><strong>Current status</strong><span>${santa.status || 'In transit'}</span></div>
      <div class="santa-pill"><strong>Speed</strong><span>${santa.speed || 'Hyper-sonic vibes'}</span></div>
      <div class="santa-pill"><strong>Gift count</strong><span>${santa.delivered || 'Millions & counting'}</span></div>
    </div>
  `;

  mapEl.innerHTML = buildMap(Number(santa.lat) || 64.7511, Number(santa.lon) || -147.3494);

  routeEl.innerHTML = santa.nextStops
    .map((stop, idx) => `<li><strong>#${idx + 1}</strong> ${stop}</li>`)
    .join('');
};

const normalizeSantaPayload = (payload) => {
  if (!payload) return fallbackSanta;
  const route = payload.nextStops || payload.stops || payload.route || fallbackSanta.nextStops;
  return {
    location: payload.location || payload.city || 'Somewhere festive',
    country: payload.region || payload.country || '',
    lat: payload.lat || payload.latitude || payload.latitute || fallbackSanta.lat,
    lon: payload.lng || payload.lon || payload.longitude || fallbackSanta.lon,
    speed: payload.speed || 'Warp sleigh engaged',
    population: payload.population || 'Millions snoozing',
    delivered: payload.delivered || payload.presents_delivered || 'Counting gifts...',
    status: payload.status || payload.message || 'In transit',
    nextStops: Array.isArray(route) ? route : fallbackSanta.nextStops,
  };
};

const fetchSanta = async () => {
  statusEl.querySelector('.santa-alert').textContent = 'Contacting Santa Tracker API...';
  try {
    const res = await fetch('https://santa-api.vercel.app/api/track');
    if (!res.ok) throw new Error('Santa API temporarily unavailable');
    const payload = await res.json();
    const santa = normalizeSantaPayload(payload);
    renderSanta(santa);
  } catch (err) {
    renderSanta(fallbackSanta, err.message);
  }
};

export const SantaTracker = {
  render() {
    dom.gameArea.innerHTML = `
      <div class="status" aria-label="Santa tracker status header">
        <span aria-hidden="true">🛰️</span><strong>North Pole Radar</strong>
        <span class="pill">Live Santa Tracker</span>
        <span class="pill santa-badge">Free API • No sign-up</span>
      </div>
      <div class="santa-atmosphere" aria-hidden="true">
        <div class="santa-aurora"></div>
        <div class="santa-lights-trail"></div>
        <div class="santa-flakes"></div>
      </div>
      <div class="santa-grid">
        <div class="santa-card">
          <div id="santaStatus"></div>
          <div id="santaMeta"></div>
          <div class="santa-cta">
            <button class="action" id="refreshSanta">🔄 Refresh tracker</button>
            <span class="pill">Auto-refresh with fallback</span>
          </div>
        </div>
        <div class="santa-card">
          <h3>Flight Map</h3>
          <div class="santa-map" id="santaMap" aria-label="Santa location map"></div>
        </div>
      </div>
      <div class="santa-card" style="margin-top:12px;">
        <h3>Next rooftops</h3>
        <p class="muted">Pulled from Santa Tracker API when available. Shows last known hop and probable path.</p>
        <ul class="santa-route" id="santaRoute"></ul>
      </div>
      <div class="santa-grid santa-deep-grid">
        <div class="santa-card santa-feed-card">
          <div class="santa-feed-head">
            <div>
              <h3>NORAD live radar preview</h3>
              <p class="muted">Official NORAD tracker embedded with a direct link to the full experience.</p>
            </div>
            <a class="pill tiny" href="https://www.noradsanta.org/" target="_blank" rel="noopener">Open NORAD ↗</a>
          </div>
          <div class="norad-frame" id="noradFrame" aria-label="NORAD Santa tracker embed">
            <iframe src="${noradFeedUrl}" title="NORAD Santa tracker preview" loading="lazy"></iframe>
          </div>
          <p class="muted">If the preview looks shy, tap the NORAD link to open their official tab.</p>
        </div>
        <div class="santa-card santa-directory" id="santaDirectory">
          <h3>Other Santa trackers</h3>
          <p class="muted">Jump out to other live globes, webcams, and North Pole radio streams.</p>
          <div class="santa-link-grid" aria-label="External Santa tracker links"></div>
        </div>
      </div>
    `;

    statusEl = document.getElementById('santaStatus');
    routeEl = document.getElementById('santaRoute');
    mapEl = document.getElementById('santaMap');
    metaEl = document.getElementById('santaMeta');
    const directory = document.getElementById('santaDirectory')?.querySelector('.santa-link-grid');

    document.getElementById('refreshSanta').addEventListener('click', fetchSanta);

    if (directory) {
      directory.innerHTML = trackerLinks
        .map(
          (tracker) => `
            <a class="santa-link-card" href="${tracker.url}" target="_blank" rel="noopener">
              <div class="santa-link-top">
                <span class="pill tiny">${tracker.badge}</span>
                <span aria-hidden="true">↗</span>
              </div>
              <strong>${tracker.name}</strong>
              <p>${tracker.note}</p>
            </a>
          `
        )
        .join('');
    }

    renderSanta(fallbackSanta, 'Loading first ping...');
    fetchSanta();
  },
};
