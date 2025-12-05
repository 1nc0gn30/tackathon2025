import { dom } from '../utils/dom.js';
import { cleanupTimers, state } from '../utils/state.js';
import { snowWatchlist } from '../data/catalog.js';
import { setAccent } from '../utils/dom.js';

const snowCodes = new Set([71, 73, 75, 77, 85, 86]);
let logEl, weatherEl, snowPlacesEl, webcamEl, weatherStatusEl, searchForm, searchInput;

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
  weatherStatusEl.textContent = 'Updated just now via Open-Meteo';
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
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = await res.json();
  if (!data.current) throw new Error('No current weather block');
  state.lastLocationLabel = label;
  renderCurrentWeather(data.current, label);
};

const findByCityName = async (name) => {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`);
  if (!res.ok) throw new Error('Lookup failed');
  const data = await res.json();
  if (!data.results || !data.results.length) throw new Error('City not found');
  const match = data.results[0];
  await fetchWeather(match.latitude, match.longitude, `${match.name}, ${match.country_code}`);
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
  addLog('⚙️ Generating crystal snowflakes...');
  let count = 0;
  state.activeInterval = setInterval(() => {
    const flake = '*'.repeat(2 + Math.floor(Math.random() * 6));
    addLog(`❄️ ${flake} drift ${++count}`);
    if (count % 6 === 0) addLog('🎅 Santa: more snow!');
  }, 450);
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
    addLog('Console booted. Brrr.');

    const startBtn = document.getElementById('snowPrint');
    const stopBtn = document.getElementById('snowStop');
    const detectBtn = document.getElementById('detectWeather');

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
};
