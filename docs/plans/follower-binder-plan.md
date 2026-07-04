# Follower Binder & Energy System — Implementation Plan

## Concept

Two new features for HuggiMon:

1. **Energy system**: likes on a user's Hub work become "energy cards" attached to their
   trainer card, Pokemon-style. Each card type maps to an energy type
   (Code → Lightning, Vision → Fire, ...). The energy count grows logarithmically
   with total likes, capped like a real Pokemon card.
2. **Follower binder**: a user's followers fill their card binder. A binder page is a
   3x3 grid of pockets (like a real card binder) showing one mini-card per follower,
   with pagination. Empty pockets render as empty sleeves.

## Design decisions

### Energy system

- Mapping (type → energy name, emoji symbol, RGB color for PNG):

| Card type | Energy | Symbol | Color (RGB) |
|---|---|---|---|
| Code | Lightning | ⚡ | (250, 204, 21) |
| Vision | Fire | 🔥 | (239, 68, 68) |
| Audio | Water | 💧 | (59, 130, 246) |
| NLP | Psychic | 🔮 | (168, 85, 247) |
| Multimodal | Rainbow | 🌈 | (236, 72, 153) |
| Agent | Metal | ⚙️ | (148, 163, 184) |
| Dataset | Grass | 🌿 | (34, 197, 94) |

- Energy count from total likes: `0` if `likes <= 0`, else `min(8, 1 + int(math.log2(likes)))`.
  (1 like → 1 energy, 100 likes → 7, 1000+ → capped at 8.)
- Fallback energy for unknown type: `("Colorless", "✦", (203, 213, 225))`.

### Binder

- Followers fetched via `HfApi.list_user_followers(username)` (verified: returns `User`
  objects with `username`, `fullname`, `avatar_url`; the `num_*` fields are `None` in
  this listing). `avatar_url` may be a relative path (e.g. `/avatars/xxx.svg`) — prefix
  with `https://huggingface.co` when it starts with `/`.
- Per-page enrichment only: for the 9 followers on the requested page, call
  `get_user_overview` to get `num_followers`, `num_models`, `num_datasets`, `num_spaces`.
  Failures per follower degrade gracefully to zeros (never fail the whole page).
- Mini-card derived stats (cheap, no repo listing):
  - `mini_score = num_models * 4 + num_datasets * 4 + num_spaces * 6 + min(num_followers, 50)`
  - `level = max(1, min(100, mini_score))`
  - stars: 1 (default), 2 if `mini_score >= 30`, 3 if `>= 60`, 4 if `>= 90`
  - `energy_count = min(6, int(math.log2(num_followers + 1)))`
- Followers list cached in-process per username with a 10-minute TTL (simple dict,
  no external dependency) so page navigation doesn't refetch.

## Tasks

### Task 1 — Energy module + card data integration

**Files:** new `src/energy.py`, modify `src/scoring.py`, `app.py` (JSON endpoint only),
new `tests/test_energy.py`, new `requirements-dev.txt`, new `tests/__init__.py`.

- Create `src/energy.py`:
  - `ENERGY_BY_TYPE: dict[str, EnergyInfo]` with the mapping table above.
    `EnergyInfo` is a dataclass: `name: str`, `symbol: str`, `color: tuple[int, int, int]`.
  - `COLORLESS: EnergyInfo` fallback.
  - `energy_for_type(type_name: str) -> EnergyInfo`.
  - `energy_count_from_likes(likes: int) -> int` implementing the formula above.
- In `src/scoring.py`, add to `CardData`: `energy_name: str`, `energy_symbol: str`,
  `energy_count: int`. Populate them in `build_card` using the card's detected type
  and `data.total_likes`.
- In `app.py`, extend the `/api/card/{username}` JSON response with
  `"energy": {"name": ..., "symbol": ..., "count": ...}`.
- Set up testing: `requirements-dev.txt` containing `pytest>=8.0`, empty `tests/__init__.py`.
- Tests in `tests/test_energy.py` (pure unit tests, no network):
  - mapping returns expected energy for each known type, and Colorless for unknown;
  - `energy_count_from_likes`: 0 → 0, 1 → 1, 2 → 2, 100 → 7, 100000 → 8 (cap);
  - `build_card` on a synthetic `HfProfileData` populates the three energy fields
    consistently (build the dataclasses directly, no API calls).

### Task 2 — Render energies on the card (HTML + PNG)

**Files:** modify `src/card_html.py`, `src/card_renderer.py`.

- HTML card (`render_card_html`): add an energy row between the Type/Level boxes and
  the stats panel. Render `energy_count` badges: circles (22px) with the energy symbol,
  background tinted with the theme card color and a border in the theme accent.
  Add a small label like `ENERGY · {energy_name}` above the circles, styled like the
  other section labels. If `energy_count == 0`, show the label with "No energy yet".
- PNG card (`render_png`): draw the same row (label + up to 8 circles). Emoji are
  unreliable in Pillow fonts, so draw filled circles using the energy's RGB `color`
  from `src/energy.py` (import `energy_for_type` to get the color), with a thin darker
  outline. Insert the row between the Type/Level boxes and the stats panel and shift
  subsequent sections down; increase `CARD_HEIGHT` by the row height (~70px) so nothing
  overflows.
- Manual verification (no automated pixel tests): script or REPL snippet that builds a
  synthetic `CardData` and writes `/tmp/huggimon_energy_test.png`; open/inspect it and
  confirm circles render and layout doesn't overlap.

### Task 3 — Binder backend (fetcher + HTML renderer)

**Files:** new `src/binder_fetcher.py`, new `src/binder_html.py`, new `tests/test_binder.py`.

- `src/binder_fetcher.py`:
  - `@dataclass FollowerMini`: `username`, `display_name`, `avatar_url`,
    `num_followers`, `num_models`, `num_datasets`, `num_spaces`,
    plus computed `level`, `stars`, `energy_count` (formulas in Design decisions).
  - `@dataclass BinderPage`: `owner: str`, `page: int`, `total_pages: int`,
    `total_followers: int`, `cards: list[FollowerMini]` (max 9).
  - `fetch_binder_page(username: str, page: int = 1, page_size: int = 9) -> BinderPage`:
    fetch/cached followers list, clamp page into `[1, total_pages]`, enrich only the
    followers on that page via `get_user_overview` (graceful per-follower fallback to
    zeros on any exception). Raise `ValueError` for unknown user (mirror
    `fetch_hf_profile` behavior).
  - Module-level TTL cache for the followers list: `dict[str, tuple[float, list]]`,
    10-minute TTL, checked with `time.monotonic()`.
- `src/binder_html.py`:
  - `render_binder_html(binder: BinderPage) -> str` returning a self-contained HTML
    fragment (inline styles, same approach as `card_html.py`):
    - binder look: dark background (#1c1917 leather tone), rounded outer frame,
      header "🗂 {owner}'s Binder" + "{total_followers} trainers collected · page
      {page}/{total_pages}";
    - 3x3 CSS grid; each filled pocket shows avatar (48px round, with initial-letter
      fallback div when `avatar_url` is falsy), display name (truncated), `@username`,
      `LV {level}`, star glyphs (reuse ★ repetition), and a row of small energy dots
      (✦ repeated `energy_count` times);
    - always render 9 pockets: missing slots are empty sleeves (dashed border, subtle
      "empty" hint).
- Tests in `tests/test_binder.py` (mock `HfApi` methods with `unittest.mock.patch`,
  no network):
  - pagination math: 20 followers → 3 pages, page 3 has 2 cards, page clamping
    (page 0 → 1, page 99 → last);
  - overview failure for one follower → that mini-card falls back to zeros, page
    still returns 9 cards;
  - derived formulas: level/stars/energy_count for known inputs;
  - `render_binder_html` output contains 9 pockets, owner header, and empty-sleeve
    markup when fewer than 9 followers.

### Task 4 — App integration (Binder tab + API + README)

**Files:** modify `app.py`, `README.md`.

- Gradio UI: new "Binder" tab (between "Generate" and "Compare"):
  - username `gr.Textbox`, "Open binder" primary button;
  - `gr.State` for current page (int, default 1) and current username;
  - "◀ Prev" / "Next ▶" buttons wired to handlers that adjust the page state,
    call `fetch_binder_page`, and return `render_binder_html` output into a `gr.HTML`
    plus a page-info `gr.Markdown`;
  - errors surfaced via `raise gr.Error(str(e))` like `_generate_card`.
- API route: `GET /api/binder/{username}` with optional `?page=1` query param,
  returning JSON: `owner`, `page`, `total_pages`, `total_followers`, and `cards`
  (list of FollowerMini fields). 404-style error dict on unknown user, mirroring
  existing routes.
- README: document the binder feature (concept: "your followers fill your binder,
  likes are energies"), the new tab, and the `/api/binder/{username}` endpoint;
  add the `energy` field to the API section.
- Verification: `python -c "import app"` succeeds; run the app locally and check the
  tab loads (manual smoke test acceptable); run full `pytest` suite.

## Constraints

- All code, comments and docs in English.
- No new runtime dependencies (stdlib + existing deps only); pytest goes in
  `requirements-dev.txt` only.
- Follow existing code style: dataclasses, module-level helpers prefixed `_`,
  inline-styled HTML fragments.
- Conventional commits (feat/test/docs), one commit per task minimum.
