# Animated Pokemon-Style Card — Implementation Plan

## Concept

Replace the current flat HTML card preview with a **real Pokemon-TCG-style card**: authentic
layout (frame, art window, HP, stage, attacks with energy costs, weakness/retreat footer,
rarity symbol) plus **animations** — holographic shimmer, glare, sparkles for high rarities,
subtle float, and a JS pointer-tilt (3D perspective) effect. All data comes from the user's
Hugging Face profile via the existing `CardData`.

The PNG renderer (`src/card_renderer.py`) is NOT touched — it remains the shareable image.
The old `render_card_html` stays in the codebase (still used by the Compare tab) until a
follow-up cleanup.

## Design decisions

### Data derivations (pure functions from `CardData`)

| Field | Formula |
|---|---|
| HP | `min(340, round((60 + level * 2) / 10) * 10)` |
| Stage | arrows in `evolution`: 0 → "Basic", 1 → "Stage 1", 2+ → "Stage 2" |
| Attack damage | for each attack (max 2), use the two highest of `stats.model/data/space` in order: `max(10, round(stat / 10) * 10)` |
| Attack cost | per attack: `min(4, 1 + stat // 40)` energy icons |
| Weakness | map from energy name: Fire→Water, Water→Lightning, Lightning→Grass, Grass→Fire, Psychic→Metal, Metal→Fire, Rainbow→Psychic, Colorless→Psychic; displayed as `{symbol} ×2` |
| Retreat cost | repos total (`total_models+total_datasets+total_spaces`): <10 → 1, <50 → 2, else 3 |
| Card number | `{level}/151` |
| Rarity symbol | Common ●, Rare ◆, Epic ★, Legendary ★ |

### Visual design

- Card ratio 63:88 (420×588 px, `max-width: min(420px, 92vw)`, height via aspect-ratio).
- Border by rarity: Common silver (#cbd5e1), Rare gold gradient, Epic gold gradient +
  sparkles, Legendary animated rainbow gradient + sparkles.
- Card background: vertical gradient tinted with the energy color
  (`energy_for_type(card.type).color` from `src/energy.py`).
- Header row: stage badge (small pill), display name (bold serif-ish), `HP {hp}` +
  energy symbol top-right.
- Art window: inner frame (3px gold inset), avatar image `object-fit: cover` filling it;
  fallback to a large initial letter on the energy-tinted gradient when no avatar.
- Info strip under art (italic, small): `LV {level} · {type} Trainer · {total_models} models · {total_followers} followers`.
- Ability block: "Ability — {passive}" with a one-line flavor generated from stats
  (static template, e.g. "Draws power from {total_likes} likes.").
- Attacks: one row per attack — cost icons (energy-colored circles with symbol), attack
  name, damage right-aligned.
- Footer: three columns — weakness `{symbol}×2`, retreat cost (colorless dots), rarity
  symbol + card number. Below: tiny flavor text line + `huggimon.space` watermark.

### Animations

All CSS is embedded in the fragment inside a `<style>` tag, scoped under a unique root
class `hpk-card` (prefix every rule). CSS-only effects must work without JS (Gradio's
`gr.HTML` does not execute scripts):

1. **Holo shimmer** (Rare+): an overlay layer with a 60deg rainbow `linear-gradient`
   (low opacity, `mix-blend-mode: color-dodge`), `background-size: 300%`, animated
   `background-position` keyframes (~6s loop).
2. **Glare**: radial-gradient white highlight layer, slow sweep animation; when JS tilt is
   active it follows the pointer instead.
3. **Sparkles** (Epic/Legendary): layer of tiny white dots via `repeating radial-gradient`s
   with an opacity-pulse keyframe.
4. **Float**: whole card `translateY` ±6px, 6s ease-in-out infinite.
5. **JS pointer tilt**: `<script>` (IIFE, queries `document.querySelectorAll('.hpk-card')`,
   guards against double-binding with a `data-hpk-bound` attribute): on `pointermove`,
   apply `perspective(900px) rotateX/rotateY` up to ±12deg based on pointer position, and
   move the glare layer; on `pointerleave`, reset smoothly. Works on the profile page
   (served as a full HTML document); silently inert inside Gradio.
6. `prefers-reduced-motion: reduce` disables shimmer/float/sparkle animations.

### Security

Every user-controlled string (`display_name`, `username`, `avatar_url`, attack names,
passive, evolution) goes through `html.escape` (with `quote=True` for attributes).

## Tasks

### Task 1 — Avatar plumbing on CardData

**Files:** modify `src/scoring.py`, extend `tests/test_energy.py` (the existing build_card
test module). Nothing else.

- Add `avatar_url: Optional[str] = None` at the END of `CardData` (after the energy fields).
- In `build_card`, populate it from `data.user.avatar_url`, normalized: if the value is
  truthy and starts with `/`, prefix `https://huggingface.co`; otherwise pass through
  (None stays None). Reuse the same normalization rule as `src/binder_fetcher.py` — if that
  module has a small helper, import it; if the logic is inline there, write a tiny private
  helper in `scoring.py` (do NOT refactor binder_fetcher).
- Tests (in `tests/test_energy.py`, class `TestBuildCardEnergy` or a new class): build_card
  with a relative avatar → absolute URL; absolute URL kept as-is; None stays None.
- Run full suite; `python -c "import app"`.
- Commit: `feat: expose avatar url on card data`.

### Task 2 — Pokemon card renderer with animations

**Files:** new `src/pokecard_html.py`, new `tests/test_pokecard.py`. Nothing else.

- `render_pokecard_html(card: CardData) -> str` returning a self-contained fragment:
  `<div class="hpk-card hpk-{rarity-lowercase}" ...>` + scoped `<style>` + tilt `<script>`.
- Implement the data derivations table above as small pure module-level functions
  (`_hp(card)`, `_stage(card)`, `_attack_rows(card)`, `_weakness(card)`, `_retreat(card)`)
  so they are individually testable. Import `energy_for_type` from `src/energy.py` for
  colors/symbols. Expose the weakness map as a module constant.
- Implement the full visual design + animations described above. Colors: derive light/dark
  tints of the energy RGB in Python (simple channel math) and inject as CSS custom
  properties on the root div (`--hpk-c1`, `--hpk-c2`, ...), so the CSS block itself is
  static per card.
- The `<style>` and `<script>` blocks are emitted once per fragment; the script must be
  idempotent (guard attribute) since a page could embed several cards.
- Tests (`tests/test_pokecard.py`, no network — build `CardData` directly):
  - derivation functions: HP formula (incl. 340 cap and rounding), stage from the four
    evolution strings, attack damage/cost from known stats, weakness map completeness
    (every energy name incl. Colorless has an entry), retreat thresholds (9→1, 49→2, 50→3);
  - fragment contains: display name, `HP`, both attack names, stage label, card number,
    watermark;
  - rarity classes: Legendary fragment has the legendary class and sparkle markup/class,
    Common does not;
  - escaping: display_name `<script>alert(1)</script>` appears only escaped (assert the
    escaped form is present and the raw payload string is absent — note the fragment
    legitimately contains its own `<script>` tag for tilt, so assert on the payload, not
    on `<script>` itself);
  - avatar: with avatar_url → `<img` with escaped src; without → initial letter fallback.
- Visual verification (manual, not committed): write the fragment for a synthetic Legendary
  card into a minimal HTML file in /tmp, open-inspect if possible, and at minimum assert
  well-formedness by parsing with `html.parser` (stdlib `HTMLParser` — no unclosed div
  mismatch crash).
- Run full suite. Commit: `feat: add animated pokemon-style card renderer`.

### Task 3 — Integration (profile page + Generate tab + README)

**Files:** modify `src/profile_page.py`, `app.py`, `README.md`, `tests/test_profile_page.py`.

- `src/profile_page.py`: replace the `render_card_html(...)` fragment with
  `render_pokecard_html(card)`. Remove the now-unused `style` knob from
  `render_profile_page`'s behavior IF it becomes dead (keep the parameter accepted for URL
  compat but it may be ignored for the card; PNG links keep working). Keep binder section
  and share bar unchanged.
- `app.py` Generate tab: the `card_html` preview output now uses `render_pokecard_html(card)`
  instead of `render_card_html`. The style dropdown keeps affecting ONLY the PNG download —
  update its label to "PNG style" so the UI stays honest. `_generate_card` adjusts
  accordingly. Compare tab is left on the old renderer (unchanged).
- README: update the description of the card (Pokemon-style animated card: holo, tilt on
  the profile page), note that the profile page at `/{username}` shows the animated card.
- Tests: update `tests/test_profile_page.py` expectations (the page should now contain the
  `hpk-card` root class; keep the escaping test working — the pokecard escapes too).
- Verification: full pytest suite; `python -c "import app"`; launch the app, curl
  `/ImTamsi` and check the response contains `hpk-card`; kill the server.
- Commit: `feat: use animated pokemon card on profile page and generate tab`.

## Constraints

- All code, comments and docs in English.
- No new dependencies. No build step — vanilla CSS/JS embedded in the fragment.
- PNG renderer untouched. Compare tab untouched.
- Conventional commits, one per task.
