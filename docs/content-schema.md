# Content schema — `content/content.en.json`

Single source of truth for all visible copy and the knowledge-graph data. Imported by `src/main.js`, consumed by `src/sections.js` (DOM) and `src/scene/NeuralField.js` (via `graph`). To add a locale, copy this file to `content.es.json` (same shape) and import it in `main.js`.

```
{ identity, hats, graph, amplifier, experience, projects, contact }
```

### `identity`
| Field | Type | Rendered as |
|---|---|---|
| `name` | string | hero `<h1>` |
| `kicker` | string | hero accent eyebrow |
| `tagline` | string | hero subline |
| `roles` | string[] | not currently rendered |

### `hats`
`manager` and `techLead`, each `{ label: string, disciplines: string[] }` → the two-column "Two hats" section.

### `graph` (consumed by `NeuralField`, not by `sections.js`)
- `categories`: `{ manager, techlead, ai }` → hex colors for points/edges/labels.
- `nodes`: ordered array of `{ label: string, cat: "manager"|"techlead"|"ai", hub?: boolean }`. The **first `nodes.length` points** of every morph shape become these labelled hubs (`hub: true` → brighter label + 3 edges instead of 2). Constraint: `nodes.length <= NeuralField.count` (1900 desktop / 1000 mobile).

### `amplifier`
Array of `{ branch: string, message: string }` → the "I amplify every layer with AI & agents" cards (any length).

### `experience`
Array of `{ company, role, dates, summary }` → the experience rows (display order).

### `projects`
Array of `{ title, description, tech, link }` → project link cards. `link` opens in a new tab.

### `contact`
`{ headline: string, email: string, links: [{ label, url }] }` → closing section. `email` also feeds the `mailto:`. A `url` of `"cv.pdf"` must exist at the build root if used.
