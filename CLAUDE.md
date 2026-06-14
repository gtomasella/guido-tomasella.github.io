# CLAUDE.md

Personal-brand site for Guido Tomasella — Data Manager & Tech Lead. Single-page, WebGL scroll narrative. Built in **v3** (legacy v1/v2 files still in the repo root are NOT used — see "Legacy").

## What it is

One scrollable page with a persistent full-viewport WebGL point field behind DOM content. The field is a cloud of points that **forms images and morphs as you scroll**:

1. **Intro (`#intro`, ~300vh, no on-screen text):** `dispersed → neural network → "GT"`. The "neural network" stage is where the **concept labels are the protagonist** — hub nodes (your disciplines) show labels + glowing edges, and **hover highlights** a node and its connections. The intro ends by forming **GT**, which is the hero.
2. **Hero + content:** the GT image holds behind the hero, then the content sections (two hats, AI amplifier, experience, projects, contact). From the hero on, labels are **secondary** (faint, non-interactive).
3. **Contact payoff:** the field morphs `GT → "LET'S BUILD"`, and a button loops back to the top.

Message-driven, not metrics-driven. All copy lives in `content/content.en.json`.

## Stack & commands

Vite + Three.js (`three/addons`: OrbitControls, CSS2DRenderer, EffectComposer/UnrealBloom/OutputPass) + GSAP/ScrollTrigger. No framework.

```bash
npm install
npm run dev      # dev server (HMR)
npm run build    # -> dist/  (what GitHub Pages serves)
npm run preview
```

Deploy: GitHub Actions (`.github/workflows/deploy.yml`) builds and publishes `dist/` to Pages on push to `main`. `vite.config.js` uses `base: './'`.

## File map

- `index.html` — skeleton: custom cursor, `#webgl` mount (`aria-hidden`), vignette, topbar, empty `<main id="content">`, scroll cue, skip link.
- `src/main.js` — orchestrator: builds sections, creates the scene + field, wires the **scroll → morph** ScrollTriggers (intro journey + contact payoff), section reveals, the reduced-motion static path, and the custom cursor.
- `src/sections.js` — `buildSections(content, mount)`: pure content → DOM. Edit copy in JSON, never here. `data-reveal` = scroll fade-in; `data-hero` = intro-driven.
- `src/scene/SceneManager.js` — the single renderer/camera/loop + bloom, fog, gradient background, dust, OrbitControls (auto-rotate). Add systems with `add(system)`; each gets `update(t,dt,mgr)` and optional `onResize(mgr)`.
- `src/scene/NeuralField.js` — the point field. `setSegment(a,b,t)` blends between two shape indices; `labelStrength` (0..1) drives label/edge prominence + whether hover is active; `introFactor` is the load fade. Shapes order: `0 dispersed, 1 neural, 2 GT, 3 "LET'S BUILD"`.
- `src/scene/shapes.js` — morph-target generators (`dispersedCloud`, `fibonacciSphere`, `sampleText`), each returning `Float32Array(count*3)`.
- `content/content.en.json` — single source of truth for copy + graph data. See `docs/content-schema.md`.

## Editing

- **Copy / projects / experience / contact:** edit `content/content.en.json` only.
- **Graph labels/colors:** `content.graph.nodes` / `content.graph.categories`. First `N = nodes.length` points become labelled hubs, so `count` (in `main.js`, 1900 desktop / 1000 mobile) must stay `>= nodes.length`.
- **Add a section:** add data to the JSON, a template block in `sections.js` (mark elements `data-reveal`), and styles in `style.css`. Re-check morph timing since total scroll height shifts where the contact payoff lands.
- **Tune the feel:** auto-rotation speed = `autoRotateSpeed` in `SceneManager.js`; intro stage split = the `p < 0.5` boundary in `main.js`; label prominence = the `smooth(...)`/`labelStrength` values in `main.js`; bloom = `UnrealBloomPass(..., strength, radius, threshold)` in `SceneManager.js`; palette = CSS vars in `style.css`.

## Gotchas

- One `SceneManager` + one `NeuralField`, constructed once. Don't add a second renderer.
- The intro morph is driven by `#intro`'s scroll range; the payoff by `#contact`'s. Between them the field holds GT. Changing section heights re-times these — verify visually.
- `reduced` / `small` are read once at load (not reactive to resize).
- `prefers-reduced-motion`: the whole scroll journey is skipped (GT shown statically, `#intro` hidden, point oscillation frozen via the `uMotion` uniform).
- WebGL visual tuning can't be verified headlessly — always eyeball changes in a real browser.

## Legacy (in repo root, NOT part of the build — don't edit)

`js/`, `css/v2.css`, `Portfolio Premium - Guido Tomasella.html` (v2/anime.js), `A_dynamic_camera_flight_throug.mp4`, most of `uploads/`. `dist/` is generated (git-ignored).
