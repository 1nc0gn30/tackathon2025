# 1990s Christmas Portal — Production Arcade

A refactored, modular take on the original tacky Christmas portal. The experience keeps every mini-game intact (snow console, reaction lab, present hunt, jukebox, theater) while adding a professional structure, accessibility, and performance-friendly effects.

## Project structure
```
index.html
assets/
  css/
    main.css            # global styling, layout, responsive rules, cleaned CRT aesthetic
  js/
    main.js             # entry point wiring controllers, settings, effects
    data/catalog.js     # tracks, vibes, movies, snow watchlist data
    games/              # individual game controllers
      snowConsole.js
      reactionLab.js
      presentHunt.js
      jukebox.js
      theater.js
    utils/              # shared helpers & state
      accessibility.js
      dom.js
      modal.js
      screenshot.js
      settings.js
      state.js
    effects/            # visual + interaction effects
      konami.js
      parallax.js
      snowfall.js
      webglGlow.js
```

## Running
Open `index.html` in any modern browser. No build step is required. Optional WebGL glow automatically falls back if unavailable.

## Key improvements
- Modular ES module architecture with reusable utilities and data separation.
- Production-quality styling with reduced duplication, responsive layout, and optional high-contrast mode.
- Settings panel for toggling snowfall, WebGL glow, and reduced motion.
- WebGL glow canvas (gracefully degrades) plus classic Konami easter egg.
- Accessibility: keyboard-operable ornaments, ARIA labels, and focus styles.
- Screenshot postcard button still powered by `html2canvas`.
