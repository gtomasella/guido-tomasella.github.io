# Impeccable — audit & improvement plan (v3 site)

> Generated 2026-06-15. Skill installed at `.claude/skills/impeccable/` (v3.6.0, by Paul Bakaus).
> Method: every DOM/CSS/copy decision cross-checked against impeccable's 41 deterministic
> detector rules + the `audit` (technical) and `critique` (UX/heuristics) reference methodology.

## TL;DR

The **WebGL engine is high craft, not slop** — bespoke shaders, custom morph targets, a real
peak-and-end arc (`dispersed → GT → "LET'S BUILD"`), one renderer, reduced-motion + a11y
scaffolding. **Keep it.** The problem is the **DOM chrome wrapped around it**, which stacks ~9 of
impeccable's named AI tells. Fixing the chrome (palette, type, numbered/eyebrow scaffolding, glass
cards, copy cadence) is what moves the site from "techy AI-portfolio template" to something singular.

## Findings (the "verify")

Severity: P0 blocking · P1 major · P2 minor · P3 polish. Rule id = impeccable detector rule.

| # | Finding | Rule id | Sev | Where |
|---|---------|---------|-----|-------|
| 1 | Cyan accent (#22d3ff) on near-black + violet shader cycle = the *named* AI palette | `ai-color-palette` | P0 | `style.css` `--accent`/`--bg`; NeuralField palettes |
| 2 | Numbered sections `01–06` + giant ghost digit | `numbered-section-markers` | P0 | `sections.js` `frame__num`/`frame__ghost` |
| 3 | Space Grotesk for everything — explicitly on impeccable's "overused fonts" list | `overused-font` | P0 | `index.html` font link; `--font` |
| 4 | Tiny uppercase tracked label above the hero **and** every section | `hero-eyebrow-chip` / `repeated-section-kickers` | P1 | `.eyebrow`, `frame__label` |
| 5 | `backdrop-filter: blur` glass cards as the default surface | `glassmorphism` | P1 | `.hat`, `.card`, `.proj` |
| 6 | Bordered cards nested inside the bordered HUD frame | `nested-cards` | P1 | `.frame` > `.hat`/`.card`/`.proj` |
| 7 | Em-dash overuse + "X, not Y" manufactured-contrast cadence | `em-dash-overuse` / `aphoristic-cadence` | P1 | `content.en.json` (amplifier, projects, tagline) |
| 8 | Dim/faint body text can drop below 4.5:1 over the bright, moving particle field | `low-contrast-text` | P1 | `--text-dim`/`--text-faint` over `#webgl` |
| 9 | Every section is the same HUD frame + same 2-col body; some mono labels <12px | `monotonous-spacing` / `tiny-text` | P2 | `.frame`, `.scrollcue` (10.5px), `.nav` (11.5px) |

Also flagged minor (P2/P3): display headings exceed the 6rem clamp ceiling
(`hero__name` → 8rem, `contact__headline` → 9rem); accent side-border on `.roles li`
(`border-accent`); render loop never pauses off-screen (perf); fixed-height `.frame` can clip
content on small viewports.

**Heuristic / critique read:** peak-end arc is strong (GT peak, "LET'S BUILD" ending) — keep it.
The flatness is in the **middle** (hats → amplify → work → projects), where identical frames kill
rhythm and the per-section eyebrow + number scaffolding reads as machine-generated structure.

## Plan (improve · optimize) — mapped to impeccable commands

Each phase ends with a check. Honest limit: final WebGL/scroll feel is validated in Guido's real
browser (headless can't render WebGL reliably) — same constraint as all prior v3 work.

- **Phase 0 — Ground the skill.** Run `/impeccable init` to write `PRODUCT.md` + `DESIGN.md`
  (audience, brand, voice, palette, components). Without it `context.mjs` reports `NO_PRODUCT_MD`
  and every command runs blind. *Check: `context.mjs` prints PRODUCT.md.*
- **Phase 1 — Diagnose formally.** `/impeccable critique` (UX heuristics, cognitive load,
  personas) + `/impeccable audit` (a11y, perf, responsive). *Check: prioritized P0–P3 report that
  matches/extends this table.*
- **Phase 2 — Identity refresh (the memorable core).** `/impeccable colorize` to move off
  cyan-on-dark to an ownable palette (OKLCH via `palette.mjs`); `/impeccable typeset` to a
  distinctive display + humanist body pairing off the overused list. **Validate palette + type as a
  concept BEFORE applying** (CLAUDE.md §5 + codex Step B "confirm palette"). *Check: Guido approves
  swatches/specimen.*
- **Phase 3 — De-slop the chrome.** `/impeccable quieter`: remove the `01–06` numbers + ghost
  digits, drop the per-section eyebrow, replace glass cards with solid tinted surfaces, unwrap the
  card-in-frame nesting. `/impeccable layout`: differentiate the six sections so they're not one
  repeated HUD frame. *Check: detector tells 2,4,5,6,9 clear; sections visually distinct.*
- **Phase 4 — Copy pass.** Rewrite `content.en.json` in Guido's voice: kill em-dash overuse and the
  "X, not Y" cadence, drop residual buzzwords. *Check: ≤2 em-dashes total; no aphoristic rebuttal
  pattern.*
- **Phase 5 — Optimize.** Guarantee text contrast over the field (scrim/plate behind text blocks);
  pause the render loop when the canvas is off-screen / tab hidden; keep the DPR cap. *Check:
  4.5:1 holds over bright field regions; loop idles when hidden.*
- **Phase 6 — Re-verify & ship.** Re-run `critique`/`audit`, confirm P0/P1 cleared, then build →
  deploy to `main` (existing loop). *Check: clean audit; live site updated, reversible via git.*

## Decisions still open for Guido

1. **How far on identity?** (a) keep cyan, only de-slop the chrome — low risk; (b) full
   re-palette + re-type off the overused defaults — higher impact, changes the site's signature.
2. **Numbered sections + eyebrows:** confirmed OK to remove? (They're part of the current "HUD"
   personality but are two of the strongest tells.)
3. **Scope:** all phases, or only Phases 1 + 3 + 5 (diagnose, de-slop, optimize) without touching
   palette/type?
