# Card Variants (ex / Shiny / Gold…) & Mini Pokecard Binder — Implementation Plan

## Concept

Real Pokemon TCG cards come in variants: plain commons, holos, "ex" cards, full-art GX,
shiny ("brillant") and gold rares. HuggiMon cards get the same treatment, **driven by the
card's level**:

1. A shared **variant tier system** maps a level to a variant (name, badge, visual effects).
2. The **main pokecard** (`src/pokecard_html.py`) displays the variant badge next to the
   name ("ex", "GX", …) and its visual effects (holo / sparkles / rainbow / gold frame)
   are now gated by the variant instead of by rarity. Rarity keeps its footer symbol.
3. The **follower binder** pockets become **mini pokecards**: compact TCG-style cards
   (frame, art, LV, energy dots) with the same variant system applied to each follower's
   level — a high-level follower shines in your binder like a gold rare.

## Design decisions

### Variant tiers (module `src/card_variant.py`)

`@dataclass(frozen=True) Variant`: `name: str`, `badge: str` (short label shown next to
the card name, may be empty), `css_class: str`, `holo: bool`, `sparkles: bool`,
`rainbow_frame: bool`, `gold_frame: bool`.

`variant_for_level(level: int) -> Variant`, thresholds on level:

| Level | Variant name | Badge | Effects |
|---|---|---|---|
| < 25 | Standard | (none) | none |
| 25–44 | Holo | (none) | holo |
| 45–64 | ex | "ex" | holo + metallic silver frame accent (css class only) |
| 65–84 | GX | "GX" | holo + sparkles |
| 85–104 | Shiny | "✦ shiny" | holo + sparkles + rainbow frame |
| ≥ 105 | Gold | "★ gold" | holo + sparkles + gold animated frame |

CSS classes: `hpk-v-standard`, `hpk-v-holo`, `hpk-v-ex`, `hpk-v-gx`, `hpk-v-shiny`,
`hpk-v-gold`. Levels are ints ≥ 1 (clamp negatives to Standard).

### Main card changes (`src/pokecard_html.py`)

- Root div gains the variant css class (alongside the existing rarity class, which stays
  for the footer symbol only).
- Badge: rendered right after the display name — small italic capsule, silver gradient
  text for "ex", gold for "GX"/"gold", rainbow-ish for shiny (static CSS, no new colors
  computed in Python). Empty badge → no capsule.
- Effect gating switches from `HOLO_RARITIES`/`SPARKLE_RARITIES` (delete these) to the
  variant flags: holo layer if `variant.holo`, sparkles if `variant.sparkles`.
- Frame: existing rarity frames are replaced by variant frames — Standard/Holo silver,
  ex metallic silver, GX gold gradient, Shiny rainbow animated, Gold gold animated
  (reuse/adapt the existing gradient + rainbow keyframes; the Legendary rainbow frame
  keyframe already exists and can be renamed/reused).
- `_safe_rarity` and the rarity footer symbol stay unchanged.

### Mini pokecards in the binder (`src/binder_html.py`)

Replace the flat pocket content with a **mini pokecard** per follower, still inside the
3x3 leather binder grid (binder frame, header, empty sleeves and pagination unchanged):

- Mini card: `aspect-ratio: 63/88`, width 100% of the pocket, border-radius 10px,
  4px frame colored by variant (silver / gold / animated rainbow — reuse a scoped
  mini CSS block emitted once per binder fragment, classes prefixed `hpkm-`).
- Content top→bottom: name row (display name truncated + variant badge if any),
  small `LV {level}` + stars row, art area (avatar `object-fit: cover` or initial
  fallback) taking ~45% height, footer row with energy dots (`✦` × energy_count,
  colored) and `@username` (tiny, muted).
- Variant per follower: `variant_for_level(card.level)` — same module.
- Holo effect on minis: a single shimmer overlay (CSS-only, reuse the same gradient
  technique, class `hpkm-holo`) for variants with `holo`; sparkles overlay `hpkm-sparkles`
  when `variant.sparkles`. Keep it lightweight: no tilt script for minis.
- `prefers-reduced-motion` disables mini animations too.
- Escaping rules unchanged (`html.escape` everywhere).

### What does NOT change

- `src/card_renderer.py` (PNG), `src/card_html.py` (legacy), `src/energy.py`,
  fetchers, app routes, profile page structure. The profile page and Gradio tabs pick up
  the new visuals automatically through the two renderers.

## Tasks

### Task 1 — Variant tier module

**Files:** new `src/card_variant.py`, new `tests/test_card_variant.py`.

- Implement `Variant` dataclass + `variant_for_level` exactly per the table.
- Module constant `VARIANTS` (ordered list or dict) so tests/renderers can enumerate.
- Tests: exact boundaries (24→Standard, 25→Holo, 44→Holo, 45→ex, 64→ex, 65→GX,
  84→GX, 85→Shiny, 104→Shiny, 105→Gold, 300→Gold); negative/0 → Standard; flags per
  variant match the table; css_class values.
- Full suite green; commit `feat: add level-based card variant tiers`.

### Task 2 — Variant on the main pokecard

**Files:** modify `src/pokecard_html.py`, `tests/test_pokecard.py`.

- Wire `variant_for_level`: root class, badge capsule after the name, effect gating by
  variant flags, frames per variant (delete `HOLO_RARITIES`/`SPARKLE_RARITIES`).
- Badge styling per the design section. Badge text is internal (from the Variant
  dataclass) — no escaping needed but harmless to escape.
- Update existing tests: the rarity-gating tests become variant-gating tests (e.g.
  level 20 card → no holo; level 30 → holo, no sparkles; level 70 → holo + sparkles;
  level 110 → gold class + all effects). Keep the unknown-rarity fallback test (rarity
  still feeds the footer symbol + class). Add badge presence tests ("ex" capsule at
  level 50, no capsule at level 20).
- Update the /tmp visual preview (not committed). Full suite green; commit
  `feat: apply level-based variants to pokecard`.

### Task 3 — Mini pokecards in the binder

**Files:** modify `src/binder_html.py`, `tests/test_binder.py`, `README.md`.

- Implement the mini pokecard pockets per the design (scoped `hpkm-` CSS emitted once
  per fragment; binder frame/header/empty sleeves/pagination untouched).
- FollowerMini already carries `level`, `stars`, `energy_count`, `avatar_url`,
  `display_name`, `username` — no fetcher changes.
- Update binder tests: existing assertions on usernames/header/empty sleeves must still
  pass; adjust markup-specific assertions; add: variant class present for a high-level
  follower (e.g. level 90 → `hpk-v-shiny` on its mini card), holo overlay only for
  holo-tier minis, escaping still effective.
- README: one line in the Follower Binder section about variant tiers (ex/shiny/gold by
  level).
- Full suite green; `python -c "import app"`; live smoke: `/ImTamsi` contains `hpkm-`
  classes in the binder section; kill server, port freed. Commit
  `feat: render binder followers as variant mini pokecards`.

## Constraints

- All code, comments and docs in English. No new dependencies. Conventional commits.
- Every selector in emitted CSS prefixed `hpk-`/`hpkm-`. Escaping everywhere.
