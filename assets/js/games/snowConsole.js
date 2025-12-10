import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';
import { dom } from '../utils/dom.js';
import { cleanupTimers, state } from '../utils/state.js';
import { snowWatchlist } from '../data/catalog.js';

const snowCodes = new Set([71, 73, 75, 77, 85, 86]);
let logEl,
  weatherEl,
  snowPlacesEl,
  webcamEl,
  weatherStatusEl,
  searchForm,
  searchInput,
  snowPreviewCanvas,
  snowPreviewWrap,
  snowMakerLabel,
  snowModeStatus,
  snowModeToggle;
let snowRenderer,
  snowScene,
  snowCamera,
  snowParticles,
  snowAnimId,
  snowVelocities,
  snowCounts,
  snowResizeHandler;
let activeSnowModeIndex = 0;

const snowModes = [
  { id: 'regular', label: 'Regular', description: 'Classic flakes for the snowglobe vibe.', intensity: 26, swirl: 0.65, color: 0xffffff, fogColor: 0x0c1b23, fall: 0.015, drift: 0.008 },
  { id: 'psychedelic', label: 'Psychedelic', description: 'Neon glitter that bends around the tree.', intensity: 46, swirl: 1.2, color: 0xff78ff, fogColor: 0x1a082f, fall: 0.017, drift: 0.012 },
  { id: 'rain', label: 'Rain', description: 'Sleety rain streaks with blue neon backlight.', intensity: 32, swirl: 0.18, color: 0x7ec8ff, fogColor: 0x0a0f19, fall: 0.024, drift: 0.006 },
  { id: 'sunny', label: 'Sunny', description: 'Gentle sparkles under a warm sky.', intensity: 16, swirl: 0.05, color: 0xffdd9c, fogColor: 0x1f1405, fall: 0.01, drift: 0.004 },
];

const destroySnowPreview = () => {
  if (snowResizeHandler) {
    window.removeEventListener('resize', snowResizeHandler);
    snowResizeHandler = null;
  }
  if (snowAnimId) cancelAnimationFrame(snowAnimId);
  snowAnimId = null;
  if (snowRenderer) {
    snowRenderer.dispose();
    snowRenderer.forceContextLoss?.();
  }
  snowRenderer = null;
  snowScene = null;
  snowCamera = null;
  snowParticles = null;
  snowVelocities = null;
  snowCounts = null;
};

const initSnowPreview = () => {
  destroySnowPreview();
  if (!snowPreviewCanvas || !snowPreviewWrap || typeof THREE === 'undefined') return;

  snowRenderer = new THREE.WebGLRenderer({ canvas: snowPreviewCanvas, alpha: true, antialias: true });
  const { width, height } = snowPreviewWrap.getBoundingClientRect();
  snowRenderer.setSize(width, height);
  snowRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  snowScene = new THREE.Scene();
  const mode = snowModes[activeSnowModeIndex] || snowModes[0];
  snowScene.fog = new THREE.FogExp2(mode.fogColor, 0.12);

  snowCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 40);
  snowCamera.position.set(0, 0.2, 6);

  snowScene.add(new THREE.AmbientLight(0xaadfff, 0.5));
  const glow = new THREE.PointLight(0xfff3c4, 1.2, 22);
  glow.position.set(0.4, 2.2, 4.5);
  snowScene.add(glow);

  const count = Math.floor(240 + mode.intensity * 8);
  snowCounts = count;
  const positions = new Float32Array(count * 3);
  snowVelocities = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 1] = Math.random() * 6;
    positions[i * 3 + 2] = Math.random() * 2 - 1;
    snowVelocities[i * 2] = 0.4 + Math.random() * (mode.intensity / 50);
    snowVelocities[i * 2 + 1] = (Math.random() - 0.5) * mode.swirl;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: mode.color,
    size: 0.08,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  snowParticles = new THREE.Points(geometry, material);
  snowScene.add(snowParticles);

  const animate = () => {
    const pos = snowParticles.geometry.getAttribute('position');
    const array = pos.array;
    const time = Date.now() * 0.001;
    for (let i = 0; i < snowCounts; i++) {
      array[i * 3 + 1] -= snowVelocities[i * 2] * (mode.fall || 0.015);
      array[i * 3] += Math.sin(time + i * 0.5) * snowVelocities[i * 2 + 1] * (mode.drift || 0.008);
      if (array[i * 3 + 1] < -1.5) {
        array[i * 3 + 1] = 5.5;
        array[i * 3] = (Math.random() - 0.5) * 6;
      }
    }
    pos.needsUpdate = true;
    snowRenderer.render(snowScene, snowCamera);
    snowAnimId = requestAnimationFrame(animate);
  };

  if (!snowResizeHandler) {
    snowResizeHandler = () => initSnowPreview();
    window.addEventListener('resize', snowResizeHandler);
  }

  animate();
};

const describeWeather = (code) => {
  const map = {
    0: 'Clear skies',
    1: 'Mostly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Icy fog',
    51: 'Light drizzle',
    61: 'Light rain',
    71: 'Light snow',
    73: 'Snowy',
    75: 'Heavy snow',
    77: 'Snow grains',
    85: 'Snow showers',
    86: 'Heavy snow showers',
  };
  return map[code] || 'Mystery clouds';
};

const addLog = (message) => {
  if (!logEl) return;
  state.snowTicker.push(message);
  if (state.snowTicker.length > 50) state.snowTicker.shift();
  logEl.textContent = state.snowTicker.join('\n');
  logEl.scrollTop = logEl.scrollHeight;
};

const renderCurrentWeather = (data, label) => {
  weatherEl.innerHTML = `
    <div class="current-row">
      <div class="temp-big">${Math.round(data.temperature_2m)}°C</div>
      <div>
        <p class="muted">Feels like: ${data.apparent_temperature ? Math.round(data.apparent_temperature) + '°C' : 'N/A'}</p>
        <p class="pill tiny">${describeWeather(data.weathercode)}</p>
      </div>
    </div>
    <div class="muted">${label}</div>
  `;
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  weatherStatusEl.textContent = `Updated ${now} via Open-Meteo`;
};

const renderSnowPlaces = (places) => {
  if (!places.length) {
    snowPlacesEl.innerHTML = '<div class="snow-pill">No tracked cities are snowing right now. Settle in with cocoa.</div>';
    webcamEl.innerHTML = '<div class="snow-pill">No live snow cams available.</div>';
    return;
  }

  snowPlacesEl.innerHTML = places
    .map(
      (spot) => `
        <div class="snow-pill">
          <span aria-hidden="true">❄️</span>
          <div>
            <strong>${spot.name}</strong><br />
            ${describeWeather(spot.weathercode)} — ${Math.round(spot.temperature_2m)}°C
          </div>
        </div>
      `
    )
    .join('');

  const camCity = places.find((p) => p.cam);
  if (camCity && camCity.cam) {
    webcamEl.innerHTML = `
      <div class="webcam-frame" aria-label="Live snow webcam for ${camCity.name}">
        <iframe src="${camCity.cam}" allowfullscreen title="${camCity.name} snow cam"></iframe>
      </div>
      <small>Live cam: ${camCity.name} (public YouTube embed)</small>
    `;
  } else {
    webcamEl.innerHTML = '<div class="snow-pill">No free public snow cam available among current snow spots.</div>';
  }
};

const fetchWeather = async (lat, lon, label) => {
  weatherStatusEl.textContent = 'Contacting Open-Meteo...';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weathercode,snowfall&timezone=auto`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();
    if (!data.current) throw new Error('No current weather block');
    state.lastLocationLabel = label;
    renderCurrentWeather(data.current, label);
  } catch (err) {
    weatherStatusEl.textContent = `Weather lookup failed: ${err.message}`;
    throw err;
  }
};

const findByCityName = async (name) => {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`
    );
    if (!res.ok) throw new Error('Lookup failed');
    const data = await res.json();
    if (!data.results || !data.results.length) throw new Error('City not found');
    const match = data.results[0];
    await fetchWeather(match.latitude, match.longitude, `${match.name}, ${match.country_code}`);
  } catch (err) {
    weatherStatusEl.textContent = err.message;
    throw err;
  }
};

const fetchSnowWatch = async () => {
  const promises = snowWatchlist.map(async (spot) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}&current=temperature_2m,weathercode&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Snow lookup failed');
    const data = await res.json();
    return { ...spot, ...data.current };
  });

  try {
    const results = await Promise.all(promises);
    const activeSnow = results.filter((spot) => snowCodes.has(spot.weathercode));
    renderSnowPlaces(activeSnow);
  } catch (err) {
    snowPlacesEl.innerHTML = `<div class="snow-pill">Could not update snow tracker: ${err.message}</div>`;
    webcamEl.innerHTML = '';
  }
};

const startStream = () => {
  cleanupTimers();
  const mode = snowModes[activeSnowModeIndex] || snowModes[0];
  addLog(`⚙️ Generating ${mode.label.toLowerCase()} snow (${mode.description})...`);
  let count = 0;
  const delay = Math.max(140, 520 - mode.intensity * 6);
  state.activeInterval = setInterval(() => {
    const flake = '*'.repeat(2 + Math.floor(Math.random() * 6));
    const drift = Math.random() > 0.5 ? '↺ swirl' : '↻ gust';
    addLog(`❄️ ${flake} drift ${++count} (${drift})`);
    if (count % 6 === 0) addLog('🎅 Santa: more snow!');
  }, delay);
};

export const SnowConsole = {
  render() {
    dom.gameArea.innerHTML = `
      <div class="status" aria-label="Snow console status">
        <span aria-hidden="true">❄️</span><strong>Snow Console</strong>
        <span class="pill">Live forecast + snow TV</span>
      </div>
      <div class="weather-grid">
        <div class="weather-card">
          <h3>My Forecast</h3>
          <p id="weatherStatus">Ready to detect your weather via Open-Meteo (no API key needed).</p>
          <div class="control-row">
            <button class="action" id="detectWeather">Use My Weather</button>
            <form class="control-row" id="cityLookup" style="gap:6px;">
              <label class="mono" for="cityInput">or type a city</label>
              <input id="cityInput" type="text" placeholder="e.g. Oslo" aria-label="City name" />
              <button class="action button-like" type="submit">Search</button>
            </form>
          </div>
          <div class="current-weather" id="currentWeather" aria-live="polite">Enter a location to see if snow is falling.</div>
        </div>
        <div class="weather-card">
          <h3>Global Snow Radar</h3>
          <p>Watching alpine towns for live flakes and cams.</p>
          <div class="snow-places" id="snowPlaces"></div>
          <div id="snowCam"></div>
        </div>
      </div>
      <div class="snow-lab" aria-label="Snow maker studio">
        <div>
          <h3>Snow Maker Studio</h3>
          <p class="muted" id="snowMakerLabel">Switch modes to change the scene instead of wrestling sliders.</p>
          <div class="lab-buttons">
            <button class="action" id="snowModeToggle">Change snow vibe</button>
            <span class="pill tiny" id="snowModeStatus">Mode: Regular</span>
          </div>
        </div>
        <div class="snow-preview" id="snowPreview" aria-label="3D snow preview">
          <canvas id="snowPreviewCanvas" aria-hidden="true"></canvas>
          <div class="snow-preview-overlay">
            <span class="pill tiny">Live 3D snow</span>
            <p class="muted">Tap to cycle: regular • psychedelic • rain • sunny.</p>
          </div>
        </div>
      </div>
      <div class="control-row">
        <button class="action" id="snowPrint">PRINT SNOW</button>
        <button class="action" id="snowStop">CLEAR</button>
      </div>
      <div class="snow-console mono" id="snowLog" role="log" aria-live="polite"></div>
    `;

    logEl = document.getElementById('snowLog');
    weatherEl = document.getElementById('currentWeather');
    weatherStatusEl = document.getElementById('weatherStatus');
    snowPlacesEl = document.getElementById('snowPlaces');
    webcamEl = document.getElementById('snowCam');
    searchForm = document.getElementById('cityLookup');
    searchInput = document.getElementById('cityInput');
    snowPreviewCanvas = document.getElementById('snowPreviewCanvas');
    snowPreviewWrap = document.getElementById('snowPreview');
    snowMakerLabel = document.getElementById('snowMakerLabel');
    snowModeStatus = document.getElementById('snowModeStatus');
    snowModeToggle = document.getElementById('snowModeToggle');
    addLog('Console booted. Brrr.');

    const startBtn = document.getElementById('snowPrint');
    const stopBtn = document.getElementById('snowStop');
    const detectBtn = document.getElementById('detectWeather');

    const setSnowMode = (index = 0) => {
      activeSnowModeIndex = (index + snowModes.length) % snowModes.length;
      const mode = snowModes[activeSnowModeIndex];
      if (snowMakerLabel) snowMakerLabel.textContent = `${mode.label}: ${mode.description}`;
      if (snowModeStatus) snowModeStatus.textContent = `Mode: ${mode.label}`;
      addLog(`❄️ Snow mode set to ${mode.label}.`);
      initSnowPreview();
    };

    const cycleSnowMode = () => setSnowMode(activeSnowModeIndex + 1);

    snowModeToggle?.addEventListener('click', cycleSnowMode);
    setSnowMode(0);

    startBtn.addEventListener('click', startStream);
    stopBtn.addEventListener('click', () => {
      cleanupTimers();
      state.snowTicker = [];
      addLog('Console cleared.');
    });

    detectBtn.addEventListener('click', () => {
      weatherStatusEl.textContent = 'Requesting browser location...';
      if (!navigator.geolocation) {
        weatherStatusEl.textContent = 'Geolocation is unavailable in this browser.';
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchWeather(latitude, longitude, 'Your location').catch((err) => {
            weatherStatusEl.textContent = `Weather lookup failed: ${err.message}`;
          });
        },
        (err) => {
          weatherStatusEl.textContent = `Location blocked (${err.message}). Try typing a city.`;
        }
      );
    });

    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (!query) return;
      weatherStatusEl.textContent = `Searching for ${query}...`;
      findByCityName(query).catch((err) => {
        weatherStatusEl.textContent = err.message;
      });
    });

    fetchSnowWatch();
  },
  destroy() {
    destroySnowPreview();
    cleanupTimers();
  },
};
