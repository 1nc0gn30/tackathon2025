import { dom } from '../utils/dom.js';
import { cleanupTimers, state } from '../utils/state.js';

const herd = [
  { id: 'dasher', name: 'Dasher', emoji: '⚡', burst: 9 },
  { id: 'dancer', name: 'Dancer', emoji: '💃', burst: 7 },
  { id: 'prancer', name: 'Prancer', emoji: '🏅', burst: 8 },
  { id: 'vixen', name: 'Vixen', emoji: '🔥', burst: 6 },
  { id: 'comet', name: 'Comet', emoji: '🌠', burst: 10 },
];

const weatherBoosts = {
  crisp: { label: 'Crisp night', bonus: 2, note: 'Steady glide' },
  snow: { label: 'Snow glow', bonus: 4, note: 'Extra lift for jumps' },
  rain: { label: 'Rainy dash', bonus: -1, note: 'Careful on turns' },
  sunny: { label: 'Sunny parade', bonus: 1, note: 'Crowd powered' },
};

const renderWeatherPills = (onChange) => {
  return Object.entries(weatherBoosts)
    .map(
      ([id, info]) => `
      <label class="pill weather-pill">
        <input type="radio" name="rallyWeather" value="${id}" ${id === 'snow' ? 'checked' : ''} />
        <div>
          <strong>${info.label}</strong>
          <small>${info.note}</small>
        </div>
      </label>
    `
    )
    .join('');
};

export const ReindeerRally = {
  render() {
    dom.gameArea.innerHTML = `
      <div class="status" aria-label="Reindeer rally status">
        <span aria-hidden="true">🦌</span><strong>Reindeer Rally</strong>
        <span class="pill">Draft the fastest sleigh team</span>
      </div>
      <div class="rally-grid">
        <div class="rally-panel">
          <p class="eyebrow">Weather lane</p>
          <div class="weather-grid" id="rallyWeather">${renderWeatherPills(() => {})}</div>
          <div class="control-row">
            <button class="action loud" id="rallyStart">Start sprint</button>
            <button class="action" id="rallyReset">Reset scoreboard</button>
          </div>
          <p class="muted">Each sprint adds points based on burst + weather bonus. First to 60 wins the cookie trophy.</p>
        </div>
        <div class="rally-score" id="rallyScore"></div>
      </div>
      <div class="rally-feed" id="rallyFeed" aria-live="polite">Ready when you are.</div>
    `;

    const scoreEl = dom.gameArea.querySelector('#rallyScore');
    const feed = dom.gameArea.querySelector('#rallyFeed');
    const weatherInputs = Array.from(dom.gameArea.querySelectorAll("input[name='rallyWeather']"));

    const progress = Object.fromEntries(herd.map((r) => [r.id, 0]));

    const activeWeather = () => weatherInputs.find((i) => i.checked)?.value || 'snow';

    const renderScore = () => {
      scoreEl.innerHTML = herd
        .map((r) => {
          const percent = Math.min(100, Math.round((progress[r.id] / 60) * 100));
          return `
            <div class="rally-track">
              <div class="rally-meta">
                <span class="pill tiny">${r.emoji} ${r.name}</span>
                <strong>${progress[r.id]} pts</strong>
              </div>
              <div class="progress-bar"><span style="width:${percent}%"></span></div>
            </div>
          `;
        })
        .join('');
    };

    const log = (message) => {
      const time = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
      const item = document.createElement('div');
      item.className = 'rally-log-entry';
      item.innerHTML = `<span class="pill tiny">${time}</span><p>${message}</p>`;
      feed.prepend(item);
      feed.scrollTop = 0;
    };

    const runSprint = () => {
      cleanupTimers();
      const weather = weatherBoosts[activeWeather()] || weatherBoosts.snow;
      log(`Sprint launched in ${weather.label}. Bonus ${weather.bonus >= 0 ? '+' : ''}${weather.bonus}.`);
      state.activeInterval = setInterval(() => {
        let winner = null;
        herd.forEach((reindeer) => {
          const boost = Math.max(1, Math.round(Math.random() * reindeer.burst)) + weather.bonus;
          progress[reindeer.id] = Math.max(0, progress[reindeer.id] + boost);
          if (progress[reindeer.id] >= 60 && !winner) {
            winner = reindeer;
          }
        });
        renderScore();
        if (winner) {
          clearInterval(state.activeInterval);
          state.activeInterval = null;
          log(`${winner.emoji} ${winner.name} takes the cookie trophy!`);
        }
      }, 650);
    };

    const reset = () => {
      cleanupTimers();
      herd.forEach((r) => {
        progress[r.id] = 0;
      });
      renderScore();
      feed.innerHTML = 'Scoreboard cleared. Draft your next sprint!';
    };

    dom.gameArea.querySelector('#rallyStart')?.addEventListener('click', runSprint);
    dom.gameArea.querySelector('#rallyReset')?.addEventListener('click', reset);
    weatherInputs.forEach((input) => input.addEventListener('change', () => log(`Weather switched to ${weatherBoosts[input.value].label}.`)));

    renderScore();
  },
  destroy() {
    cleanupTimers();
  },
};
