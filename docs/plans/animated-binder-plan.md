# Animated Binder — Page Turning & Card Pull-Out — Implementation Plan

## Concept

On the public profile page (`/{username}`), the follower binder becomes interactive:

1. **Page turning**: Prev/Next trigger a 3D page-flip animation (like turning a real
   binder page) instead of a full page reload. The new page's content is fetched from a
   new HTML endpoint.
2. **Card pull-out**: clicking a mini card "pulls it out" of its pocket — it flies to
   the center of the screen, enlarges over a dark backdrop, gets a pointer-tilt effect
   while inspected, and animates back into its pocket on close.

**Platform constraint**: `<script>` inside Gradio's `gr.HTML` does not execute, so all
interactivity targets the profile page only. The Gradio Binder tab keeps its existing
server-side Prev/Next buttons and is NOT modified. Everything degrades gracefully:
without JS, the profile page keeps working with the existing `?page=N` links.

## Architecture

- `GET /api/binder/{username}/html?page=N` (new route in `app.py`): returns the
  server-rendered binder fragment (`render_binder_html`) as an `HTMLResponse`. JS swaps
  it into the page during the flip animation. Reuses all existing rendering/escaping.
- `src/binder_html.py`: the root `.hbinder` div gains machine-readable state:
  `data-page="{page}"`, `data-total-pages="{total_pages}"` (ints, no escaping concern,
  but escape anyway for uniformity).
- New module `src/binder_interactive.py`: `render_binder_interactive(username: str) -> str`
  returns a `<style>` + `<script>` block appended after the binder on the profile page.
  All CSS classes prefixed `hbi-`. The username is injected into JS via `json.dumps`
  (never raw f-string interpolation into JS code).
- `src/profile_page.py`: wraps the binder fragment in `<div id="hbi-binder-wrap">`,
  keeps the existing pager links (progressive enhancement: JS hides them and installs
  its own animated pager), appends the interactive block.

## Design decisions

### Page flip (JS, in binder_interactive)

- The wrap gets `perspective: 1400px`. On navigation:
  1. read current page + total from the `.hbinder` `data-*` attributes;
  2. target page = current ±1, clamped — buttons disabled at bounds;
  3. fetch `/api/binder/{username}/html?page={target}`; on non-OK response, re-enable
     buttons and bail (no UI corruption);
  4. animate: phase A — current binder rotates `rotateY(-90deg)` (transform-origin at
     the left edge for Next, right edge for Prev), ~220ms ease-in; swap innerHTML at the
     end of phase A; phase B — new content rotates from `+90deg`/`-90deg` back to `0`,
     ~220ms ease-out. Implemented with a CSS class + `transitionend` (fallback
     `setTimeout` ~300ms in case transitionend doesn't fire);
  5. update `history.replaceState` with `?page=N` so reload/share keeps the page;
  6. re-render the pager state (button disabled flags, "page N/M" label).
- The animated pager: two `<button>`s (`hbi-prev`, `hbi-next`) + a page label, styled
  like the existing `.pager-btn`. On JS init, the server-rendered `.binder-pager` links
  are hidden (`display:none`) and the JS pager is shown. A guard prevents double init.
- Concurrency guard: navigation ignored while a flip is in progress.
- `prefers-reduced-motion: reduce` (checked via `matchMedia` in JS): skip the rotation,
  instant content swap.

### Card pull-out (JS, same module)

- Event delegation: one `click` listener on the wrap; closest `.hpkm-card` wins (empty
  sleeves ignored). Survives page flips (listener on the wrap, not on cards).
- On click:
  1. measure the card's `getBoundingClientRect()`;
  2. create a fixed-position overlay (`hbi-overlay`): dark blurred backdrop + a clone of
     the card node (`cloneNode(true)`) placed at the exact source rect;
  3. next frame, transition the clone to screen center, scaled to ~min(60vw, 340px)
     width (FLIP technique: transform translate + scale, ~320ms cubic-bezier);
  4. while open: pointer-tilt on the clone (rotateX/rotateY up to ±14deg, same approach
     as the main card tilt but self-contained here — do not reuse the hpk script);
  5. close on backdrop click, ✕ button (top-right of overlay), or Escape: transition
     back to the source rect, then remove the overlay. If the binder page changed while
     open (impossible via UI since backdrop blocks it, but guard anyway), just fade out.
- The clone keeps all `hpkm-` classes so variant frames/holo animate in the enlarged
  view; add class `hbi-zoomed` enabling `will-change: transform` and stronger shadow.
- Accessibility: overlay has `role="dialog"` and `aria-modal="true"`; ✕ button is a real
  `<button aria-label="Close">`; Escape closes; body scroll locked while open
  (`overflow: hidden` on `documentElement`, restored on close).
- `prefers-reduced-motion`: no fly animation — overlay appears/disappears with a quick
  opacity fade only.
- Cursor affordance: with JS active, wrap gets class `hbi-ready`; CSS
  `.hbi-ready .hpkm-card{cursor:pointer}` plus a subtle hover lift
  (`transform: translateY(-3px)`, transition 150ms). Scoped so the Gradio tab
  (no JS → no class) is unaffected.

### Security

- Username goes into JS as `JSON.stringify` output (via Python `json.dumps`), and into
  the fetch URL via JS `encodeURIComponent`.
- The HTML endpoint output is already fully escaped by `render_binder_html`.
- No user data is interpolated into the static CSS/JS beyond that one JSON value.

## Tasks

### Task 1 — Binder HTML endpoint + data hooks

**Files:** modify `app.py`, `src/binder_html.py`, `tests/test_binder.py`. Nothing else.

- `src/binder_html.py`: root `.hbinder` div gains `data-page="{binder.page}"` and
  `data-total-pages="{binder.total_pages}"` attributes.
- `app.py`: new route registered BEFORE the catch-all `/{username}` route in source
  order (FastAPI matches more specific paths first regardless, but keep the file tidy —
  place it next to `api_binder_json`):

  ```
  @app.get("/api/binder/{username}/html")
  def api_binder_html(username: str, page: int = 1):
      try:
          binder = fetch_binder_page(username, page)
      except ValueError as e:
          raise HTTPException(status_code=404, detail=str(e)) from e
      return HTMLResponse(render_binder_html(binder))
  ```

- Tests (`tests/test_binder.py`): data attributes present with correct values in
  `render_binder_html` output; `api_binder_html` handler called directly with
  `fetch_binder_page` mocked (patch `app.fetch_binder_page`) → returns HTMLResponse
  whose body contains `hpkm-card` and the data attributes; unknown user (mock raising
  ValueError) → raises HTTPException with status 404.
- Full suite green; `python -c "import app"`. Commit:
  `feat: add binder html endpoint and page data attributes`.

### Task 2 — Animated page turning

**Files:** new `src/binder_interactive.py`, modify `src/profile_page.py`,
new `tests/test_binder_interactive.py`, modify `tests/test_profile_page.py`.

- Implement `render_binder_interactive(username)` per the design: `<style>` (classes
  `hbi-` only) + `<script>` IIFE (guard `data-hbi-bound` on the wrap). This task covers
  ONLY the flip/pager part; write the module so the pull-out can be added later (e.g.
  keep functions small, one `init()`).
- `src/profile_page.py`: wrap the binder fragment in `<div id="hbi-binder-wrap">`,
  append the interactive block after it. Existing server pager links stay in the markup.
- Tests:
  - `test_binder_interactive.py`: output contains `hbi-binder-wrap` references, the
    JSON-encoded username (test with a name containing `"` and `</script>` to prove
    safe encoding — `json.dumps` must escape it; assert the raw `</script>` sequence
    does NOT appear inside the script block), prev/next button markup, and
    `prefers-reduced-motion` handling marker (`matchMedia`);
  - `test_profile_page.py`: page contains `hbi-binder-wrap` and the script block.
  - Optional (do if `node` is available on PATH — check with `which node`): extract the
    inner JS from the fragment and run `node --check` on it in a test guarded by
    `shutil.which("node")`; skip otherwise.
- Full suite green. Commit: `feat: add animated page turning to profile binder`.

### Task 3 — Card pull-out inspection

**Files:** modify `src/binder_interactive.py`, `tests/test_binder_interactive.py`,
`README.md`.

- Add the overlay/pull-out behavior per the design (delegation on the wrap, FLIP clone
  animation, tilt while zoomed, close via backdrop/✕/Escape, scroll lock, reduced-motion
  fade, `hbi-ready` cursor affordance CSS).
- README: extend the Follower Binder section: page-flip navigation and click-to-inspect
  on the profile page.
- Tests: fragment contains overlay markup/classes (`hbi-overlay`, close button with
  `aria-label`), delegation marker (`closest`), Escape handling marker (`Escape`),
  `role="dialog"`; node syntax check still passes if node available.
- Full suite green; live smoke: start the server, curl the profile page, assert it
  contains `hbi-binder-wrap`, `hbi-overlay` (or its JS constructor string) and
  `/api/binder/` fetch URL; `curl /api/binder/ImTamsi/html?page=1` returns the fragment
  with `data-page="1"`; kill the server, port freed. Commit:
  `feat: add card pull-out inspection to profile binder`.

## Constraints

- All code, comments and docs in English. No new dependencies, vanilla JS only.
- Do not modify the Gradio Binder tab behavior, `src/pokecard_html.py`,
  `src/card_variant.py`, `src/binder_fetcher.py`.
- Every new CSS selector prefixed `.hbi-` (or `.hbi-ready .hpkm-…` descendant rules).
- JS: single IIFE per concern, no globals, idempotent init, no external libs.
- Conventional commits, one per task.
