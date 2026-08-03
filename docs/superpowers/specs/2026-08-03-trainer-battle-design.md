# Trainer Battle (1v1) — Design Spec

**Date:** 2026-08-03  
**Status:** Approved for implementation planning  
**Scope:** Spectacle-only automated 1v1 trainer battles with classic Pokémon game UI

## Goal

Let a Hugging Face trainer challenge another trainer to an automated duel. The fight uses each profile card’s existing stats (HP, attacks, type weakness) and plays out turn-by-turn on a classic Pokémon-style battle screen. No ranking, auth, or database.

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Format | 1v1 profile card vs profile card |
| Visual style | Classic game battle UI (HP bars, avatars as sprites, dialogue box) |
| Playback | Turn-by-turn animated (~1.2–1.8s per event), with Skip |
| Entry | Fight button on **your own** profile → enter opponent username |
| Persistence | Spectacle only; shareable URL with seed |
| Architecture | Server-computed deterministic battle log + client animator |

## Out of scope (v1)

- Multi-card teams / binder party
- Item / Stadium / Supporter binder cards as battle effects
- Sound effects / music
- Leaderboards, win tracking, auth
- Complex crit RNG beyond small seed-based damage variance
- Pixel-art Game Boy assets (style homage, modern CSS)

---

## Architecture

```
Profile /{username}  (own profile only)
  → Fight CTA
  → modal: opponent username
  → navigate to /battle?a={challenger}&b={opponent}
  → client POST /api/battle { challenger, opponent }
       ├─ load CardData ×2 (reuse HF fetch + buildCard)
       ├─ run battle-engine(seed)
       └─ return { seed, fighters, events, winner }
  → replace URL with &seed=…
  → BattleArena replays events turn-by-turn

Share / refresh:
  GET /api/battle?a=&b=&seed= → same log → replay
```

### Modules

| Path | Responsibility |
|------|----------------|
| `web/src/lib/battle-engine.ts` | Pure rules: initiative, moves, damage, weakness, KO, event list |
| `web/src/lib/battle-types.ts` | Shared DTOs (`BattleEvent`, `BattleResult`, etc.) |
| `web/src/app/api/battle/route.ts` | `POST` (new fight) + `GET` (replay with seed) |
| `web/src/app/battle/page.tsx` | Route shell; reads query params |
| `web/src/components/battle/*` | Arena, HUD, dialogue, fight modal trigger |
| `web/src/styles/battle.css` | Arena layout & animations |
| `web/src/components/ProfileActions.tsx` | Fight button (own profile) |

Reuse without change: `scoring.ts` (`hpValue`, `attackRows`, `weaknessType`), `pokemon-types.ts`, card fetch pipeline used by `/api/card`.

---

## Combat rules (v1)

Inputs per fighter: `CardData` + derived `maxHp = hpValue(card)`.

### Initiative

- Compare `stats.space`; higher acts first each round.
- Tie → challenger first.

### Moves

- Available moves from `attackRows(card)` → `[name, damage, energyCost]`.
- Fighter “energy pool” = `card.energyCount` (static for the fight).
- Each turn the active fighter plays the **highest-damage** move whose `energyCost <= energyCount`.
- If none affordable, play the cheapest move (always at least one row).

### Damage

`weaknessType(card)` returns the type that card is weak **to** (already in `scoring.ts`).

```
base = move.damage
if attacker.type === weaknessType(defender): multiplier = 1.5, effective = "super"
else if defender.type === weaknessType(attacker): multiplier = 0.75, effective = "not_very"
else: multiplier = 1, effective = "normal"
varianceFactor = 1 + seededFloatInRange(-0.05, +0.05)
damage = max(1, floor(base * multiplier * varianceFactor))
```

- **Super effective:** attacker’s type is what the defender is weak to.
- **Not very effective:** defender’s type is what the attacker is weak to (mirror of the same table).

### Turn loop

1. Emit `start`
2. While both HP > 0 and turn < 20:
   - Faster fighter attacks → `move` event
   - If defender HP ≤ 0 → `faint` + break
   - Slower fighter attacks → `move` event
   - If defender HP ≤ 0 → `faint` + break
3. If both still up at turn cap → higher remaining HP wins (tie → challenger)
4. Emit `end` with `winner`

### Seed

- `POST` without seed: generate opaque hex seed (e.g. 16 bytes).
- Engine must be pure: `simulateBattle(challenger, opponent, seed) → BattleResult`.
- `GET` with same `a`, `b`, `seed` must reproduce identical `events` and `winner`.
- Seed only affects damage variance (and any future tiny RNG); initiative/move choice stay deterministic from stats.

---

## API contract

### `POST /api/battle`

**Body**
```json
{ "challenger": "tamsi", "opponent": "clem" }
```

**200**
```json
{
  "seed": "a1b2c3d4e5f60718",
  "challenger": { "card": { "...CardData" }, "maxHp": 180 },
  "opponent": { "card": { "...CardData" }, "maxHp": 220 },
  "events": [ /* BattleEvent[] */ ],
  "winner": "challenger"
}
```

### `GET /api/battle?a={challenger}&b={opponent}&seed={seed}`

Same 200 shape as POST (recompute with provided seed). Missing/invalid seed → 400.

### Errors

| Case | Status | Message |
|------|--------|---------|
| Missing / empty username | 400 | Invalid required |
| Same challenger and opponent | 400 | Choose a different opponent |
| Unknown HF user | 404 | Trainer not found |
| HF upstream failure | 502 | Trainer data unavailable |
| Rate limited upstream | 429 | Too many requests |

Usernames normalized: trim + lowercase for comparison; preserve HF casing for display from `CardData`.

---

## Event schema

```ts
type BattleActor = "challenger" | "opponent";

type BattleEvent =
  | { type: "start" }
  | {
      type: "move";
      actor: BattleActor;
      move: string;
      damage: number;
      effective: "normal" | "super" | "not_very";
      hpAfter: { challenger: number; opponent: number };
    }
  | { type: "faint"; actor: BattleActor }
  | { type: "end"; winner: BattleActor };
```

Client applies `hpAfter` to bars; never re-simulates damage locally.

---

## UI / UX

### Profile entry

- **Fight** button in `ProfileActions` on `/{username}`.
- Challenger is always the page username (no auth: opening a profile means fighting *as* that trainer).
- Modal: opponent username input + Fight! → `router.push(/battle?a={pageUser}&b={opponent})`.
- Reject in UI (and API) if opponent normalizes to the same username as challenger.

### Battle page `/battle`

Layout (classic homage):

```
┌─────────────────────────────────────┐
│  Opponent name · Lv.XX     HP ████░ │
│                 [avatar face]       │
│                                     │
│  [avatar back-ish / mirrored]       │
│  Challenger name · Lv.XX   HP ███░░ │
├─────────────────────────────────────┤
│  Dialogue box                       │
│  « Tamsi used Model Overload! »     │
│  « It's super effective! »          │
└─────────────────────────────────────┘
```

- Avatars from `card.avatarUrl`; missing → silhouette / Poké Ball placeholder.
- HP bars animate toward `hpAfter` values.
- Dialogue pacing 1.2–1.8s per event; **Skip** jumps to final HP + end message.
- End screen: “{displayName} won the battle!” + Rematch (same pair, new POST/seed) + Back to profile.
- After first successful POST, `history.replaceState` adds `seed` for shareable replay.
- If URL already has `seed`, use GET replay path (no new random fight).

### Styling

- New `battle.css` using existing tokens (`--hk-red`, `--hk-blue`, `--hk-yellow`, `--hk-ink`, Rubik).
- Dark arena gradient + light texture; dialogue box with thick border (TCG/game feel).
- No large TCG card shells on the battle field (keep cards for profile/binder).

---

## Client flow

1. `battle/page.tsx` reads `a`, `b`, optional `seed`.
2. If missing `a` or `b` → empty state with two inputs (fallback, not primary entry).
3. If `seed` → `GET /api/battle?...`
4. Else → `POST /api/battle` then write seed into URL.
5. Pass result to `<BattleArena result={…} />` which walks `events` with timers.
6. Errors surface in dialogue / banner; link back to profile.

---

## Testing

- Unit tests for `battle-engine`: weakness multiplier, energy gating, KO, turn cap, seed stability (same inputs → same events).
- Manual: Fight from profile → anim → Skip → Rematch → share URL in new tab matches winner.

---

## Implementation notes

- Keep engine free of React / Next imports (pure TS).
- Do not expand `CardData` unless needed; prefer a thin `BattleFighter { card, maxHp, hp }` inside the engine.
- Mirror error handling patterns from existing `/api/card/[username]` routes.
- Update `HowItWorksDialog` with a short “Trainer battles” blurb after ship.
- English for all code, comments, and user-facing battle strings (or match existing EN UI copy on the site).
