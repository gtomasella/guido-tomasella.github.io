# DESIGN.md

Identity: **gold on petroleum**, editorial-serif headlines over a warm particle field. Chosen via
the impeccable audit (see `docs/impeccable-audit-and-plan.md`) to move off the generic
cyan-on-dark + Space Grotesk "AI portfolio" look toward something singular and senior.

## Tokens (source of truth: `src/style.css` `:root`)
| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#0e1417` | deep petroleum background |
| `--surface` | `#161e22` | solid cards/panels (no glass) |
| `--text` | `#e8ecea` | primary text |
| `--text-dim` | `#a8b2b0` | body / secondary |
| `--text-faint` | `#7e8b8a` | meta / mono labels |
| `--accent` | `#e3b23c` | gold — single signal accent |
| `--accent-soft` | `#f0ce7a` | bright gold (hover, highlights) |
| `--accent-ink` | `#2a2206` | text on gold fills |

## Type
- **Display / headlines:** Newsreader (serif, editorial). Hero name, section titles, card titles.
- **Body:** Hanken Grotesk (humanist sans). Serif + sans = a real contrast-axis pairing.
- **Mono (data only, sparingly):** JetBrains Mono. Disciplines, dates, tech, nav.

## Field (WebGL)
Particle shader cycles three **warm** palettes (Ember / Brass / Signal — gold, amber, copper, bone),
never cyan/violet. Background gradient + fog are petroleum; dust is dim warm.

## Principles (enforced, from the audit)
- No numbered section markers (`01–06`), no ghost digits, no per-section eyebrow chips.
- Solid surfaces, never glassmorphism. Avoid card-in-card borders (sections are tinted regions, not
  bordered frames around bordered cards).
- One accent (gold). No gradient text, no side-stripe borders.
- Headlines serif; never tighten serif tracking past ~-0.02em. Display headings capped ~6.5rem.
- Motion: ease-out only (GSAP `power2/3.out`), no bounce/elastic.
- Body legibility over the moving field comes from the panel scrim (`.frame` bg tint) + text-shadow;
  keep body on `--text-dim` or lighter.
