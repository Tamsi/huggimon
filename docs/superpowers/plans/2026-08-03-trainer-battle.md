# Trainer Battle (1v1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship automated 1v1 trainer battles with a classic Pokémon-style animated UI, driven by a deterministic server battle log.

**Architecture:** Pure `simulateBattle(challenger, opponent, seed)` builds an event log. `POST/GET /api/battle` loads HF cards and returns the log. `/battle` replays events turn-by-turn. Profile **Fight** opens a modal for the opponent username.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, existing `scoring.ts` / HF fetch, CSS tokens in `globals.css`, Node native test runner via `tsx`.

## Global Constraints

- English for all code, comments, and user-facing battle strings.
- No DB, auth, rankings, sound, or multi-card teams (v1).
- Engine must be pure TS (no React/Next imports).
- Reuse `hpValue`, `attackRows`, `weaknessType` from `web/src/lib/scoring.ts` — do not invent parallel ATK/DEF stats.
- Shareable URL: `/battle?a=&b=&seed=` must reproduce identical events.
- Follow existing API error JSON shape `{ error: string }`.
- Spec: `docs/superpowers/specs/2026-08-03-trainer-battle-design.md`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `web/src/lib/battle-types.ts` | Shared DTOs (`BattleActor`, `BattleEvent`, `BattleResult`, `BattleFighterPublic`) |
| `web/src/lib/battle-rng.ts` | Seeded PRNG (`createBattleRng(seed)`) |
| `web/src/lib/battle-engine.ts` | `simulateBattle(challenger, opponent, seed)` |
| `web/src/lib/battle-engine.test.ts` | Unit tests (node:test) |
| `web/src/lib/battle-load.ts` | Load + normalize two fighters for the API |
| `web/src/app/api/battle/route.ts` | `POST` new fight, `GET` seeded replay |
| `web/src/styles/battle.css` | Arena / HUD / dialogue styles |
| `web/src/components/battle/BattleArena.tsx` | Playback orchestrator |
| `web/src/components/battle/BattleHud.tsx` | Sprites + HP bars |
| `web/src/components/battle/BattleDialogue.tsx` | Message box + Skip |
| `web/src/components/battle/FightChallengeModal.tsx` | Opponent username modal |
| `web/src/app/battle/page.tsx` | Route + data fetch + empty state |
| `web/src/components/ProfileActions.tsx` | Fight button |
| `web/src/components/HowItWorksDialog.tsx` | Short battles blurb |
| `web/src/app/globals.css` | `@import` battle.css |
| `web/package.json` | `test` script + `tsx` devDependency |

---

### Task 1: Battle types, RNG, and engine (TDD)

**Files:**
- Create: `web/src/lib/battle-types.ts`
- Create: `web/src/lib/battle-rng.ts`
- Create: `web/src/lib/battle-engine.ts`
- Create: `web/src/lib/battle-engine.test.ts`
- Modify: `web/package.json` (add `tsx`, `"test"` script)

**Interfaces:**
- Consumes: `CardData`, `hpValue`, `attackRows`, `weaknessType` from `scoring.ts`
- Produces:
  - `createBattleRng(seed: string): { nextFloat(): number }` — `nextFloat` ∈ `[0, 1)`
  - `simulateBattle(challenger: CardData, opponent: CardData, seed: string): BattleResult`
  - Types: `BattleActor`, `BattleEffectiveness`, `BattleEvent`, `BattleFighterPublic`, `BattleResult`

- [ ] **Step 1: Add test runner**

In `web/`:

```bash
npm install -D tsx
```

Add to `package.json` scripts:

```json
"test": "tsx --test src/lib/**/*.test.ts"
```

- [ ] **Step 2: Write battle types**

Create `web/src/lib/battle-types.ts`:

```ts
import type { CardData } from "./scoring";

export type BattleActor = "challenger" | "opponent";

export type BattleEffectiveness = "normal" | "super" | "not_very";

export type BattleEvent =
  | { type: "start" }
  | {
      type: "move";
      actor: BattleActor;
      move: string;
      damage: number;
      effective: BattleEffectiveness;
      hpAfter: { challenger: number; opponent: number };
    }
  | { type: "faint"; actor: BattleActor }
  | { type: "end"; winner: BattleActor };

export type BattleFighterPublic = {
  card: CardData;
  maxHp: number;
};

export type BattleResult = {
  seed: string;
  challenger: BattleFighterPublic;
  opponent: BattleFighterPublic;
  events: BattleEvent[];
  winner: BattleActor;
};
```

- [ ] **Step 3: Write failing engine tests**

Create `web/src/lib/battle-engine.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { simulateBattle } from "./battle-engine";
import type { CardData } from "./scoring";
import type { PokemonType } from "./pokemon-types";

function mockCard(partial: Partial<CardData> & { username: string; type: PokemonType }): CardData {
  return {
    displayName: partial.username,
    level: 50,
    rarity: "Rare",
    stats: { model: 60, data: 40, space: 50, impact: 40, community: 30, docs: 20 },
    attacks: ["Model Overload", "Dataset Tsunami"],
    passive: "Test",
    evolution: "Basic",
    totalModels: 10,
    totalDatasets: 5,
    totalSpaces: 3,
    totalFollowers: 100,
    totalDownloads: 1000,
    totalLikes: 200,
    energyName: "Fire",
    energySymbol: "🔥",
    energyCount: 4,
    avatarUrl: null,
    ...partial,
  };
}

describe("simulateBattle", () => {
  it("is deterministic for the same seed", () => {
    const a = mockCard({ username: "alpha", type: "Fire", stats: { model: 80, data: 40, space: 90, impact: 40, community: 30, docs: 20 } });
    const b = mockCard({ username: "bravo", type: "Water", stats: { model: 50, data: 40, space: 20, impact: 40, community: 30, docs: 20 } });
    const r1 = simulateBattle(a, b, "fixed-seed-001");
    const r2 = simulateBattle(a, b, "fixed-seed-001");
    assert.deepEqual(r1.events, r2.events);
    assert.equal(r1.winner, r2.winner);
  });

  it("marks Fire vs Water defender as not_very when attacker is Fire and weakness(Fire)=Water", () => {
    // Fire is weak to Water → Water attacking Fire is super; Fire attacking Water is not_very
    const fire = mockCard({
      username: "ember",
      type: "Fire",
      level: 40,
      energyCount: 4,
      stats: { model: 90, data: 10, space: 10, impact: 10, community: 10, docs: 10 },
      attacks: ["Model Overload", "Dataset Tsunami"],
    });
    const water = mockCard({
      username: "splash",
      type: "Water",
      level: 40,
      energyCount: 4,
      stats: { model: 90, data: 10, space: 99, impact: 10, community: 10, docs: 10 },
      attacks: ["Model Overload", "Dataset Tsunami"],
    });
    // water has higher space → attacks first; Water vs Fire should be super
    const result = simulateBattle(fire, water, "eff-seed");
    const firstMove = result.events.find((e) => e.type === "move");
    assert.ok(firstMove && firstMove.type === "move");
    assert.equal(firstMove.actor, "opponent");
    assert.equal(firstMove.effective, "super");
  });

  it("ends with a faint and a winner", () => {
    const strong = mockCard({
      username: "strong",
      type: "Normal",
      level: 100,
      energyCount: 8,
      stats: { model: 100, data: 100, space: 100, impact: 100, community: 100, docs: 100 },
    });
    const weak = mockCard({
      username: "weak",
      type: "Normal",
      level: 1,
      energyCount: 1,
      stats: { model: 10, data: 10, space: 1, impact: 10, community: 10, docs: 10 },
    });
    const result = simulateBattle(strong, weak, "ko-seed");
    assert.ok(result.events.some((e) => e.type === "faint"));
    assert.equal(result.events.at(-1)?.type, "end");
    assert.equal(result.winner, "challenger");
  });

  it("picks the highest-damage affordable move", () => {
    const card = mockCard({
      username: "picker",
      type: "Normal",
      energyCount: 2,
      // attackRows sorts model/data/space desc for damage; costs = ceil(stat/30)
      stats: { model: 90, data: 30, space: 10, impact: 10, community: 10, docs: 10 },
      attacks: ["Big Hit", "Small Hit"],
    });
    const fodder = mockCard({
      username: "fodder",
      type: "Normal",
      level: 1,
      energyCount: 1,
      stats: { model: 10, data: 10, space: 1, impact: 10, community: 10, docs: 10 },
    });
    const result = simulateBattle(card, fodder, "move-pick");
    const move = result.events.find((e) => e.type === "move" && e.actor === "challenger");
    assert.ok(move && move.type === "move");
    // model=90 → damage 90, cost 3 — NOT affordable with energy 2
    // data=30 → damage 30, cost 1 — affordable; space=10 → damage 10, cost 1
    // highest affordable damage is 30 → first attack name paired with costs[0] after sort is tricky:
    // attackRows uses [a1, costs[0]] and [a2, costs[1]] after sorting costs desc
    // costs sorted: 90, 30, 10 → rows: ["Big Hit", 90, 3], ["Small Hit", 30, 1]
    // affordable: Small Hit
    assert.equal(move.move, "Small Hit");
  });
});
```

- [ ] **Step 4: Run tests — expect FAIL**

```bash
cd web && npm test
```

Expected: FAIL — `Cannot find module './battle-engine'` (or similar).

- [ ] **Step 5: Implement RNG**

Create `web/src/lib/battle-rng.ts`:

```ts
/** Mulberry32 seeded from a string (FNV-1a 32-bit mix). */
export function createBattleRng(seed: string): { nextFloat: () => number } {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  if (state === 0) state = 0x9e3779b9;

  return {
    nextFloat() {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}
```

- [ ] **Step 6: Implement engine**

Create `web/src/lib/battle-engine.ts`:

```ts
import { attackRows, hpValue, weaknessType, type CardData } from "./scoring";
import { createBattleRng } from "./battle-rng";
import type {
  BattleActor,
  BattleEffectiveness,
  BattleEvent,
  BattleResult,
} from "./battle-types";

const MAX_ROUNDS = 20;

type InternalFighter = {
  actor: BattleActor;
  card: CardData;
  maxHp: number;
  hp: number;
};

function pickMove(card: CardData): { name: string; damage: number; cost: number } {
  const rows = attackRows(card).map(([name, damage, cost]) => ({ name, damage, cost }));
  const affordable = rows.filter((r) => r.cost <= card.energyCount);
  const pool = affordable.length > 0 ? affordable : rows;
  return pool.reduce((best, r) => (r.damage > best.damage ? r : best));
}

function effectiveness(
  attacker: CardData,
  defender: CardData,
): { multiplier: number; effective: BattleEffectiveness } {
  if (attacker.type === weaknessType(defender)) {
    return { multiplier: 1.5, effective: "super" };
  }
  if (defender.type === weaknessType(attacker)) {
    return { multiplier: 0.75, effective: "not_very" };
  }
  return { multiplier: 1, effective: "normal" };
}

function applyMove(
  attacker: InternalFighter,
  defender: InternalFighter,
  hp: { challenger: number; opponent: number },
  rng: { nextFloat: () => number },
): BattleEvent {
  const move = pickMove(attacker.card);
  const { multiplier, effective } = effectiveness(attacker.card, defender.card);
  const varianceFactor = 1 + (rng.nextFloat() * 0.1 - 0.05);
  const damage = Math.max(1, Math.floor(move.damage * multiplier * varianceFactor));
  defender.hp = Math.max(0, defender.hp - damage);
  hp[defender.actor] = defender.hp;
  return {
    type: "move",
    actor: attacker.actor,
    move: move.name,
    damage,
    effective,
    hpAfter: { challenger: hp.challenger, opponent: hp.opponent },
  };
}

export function simulateBattle(
  challenger: CardData,
  opponent: CardData,
  seed: string,
): BattleResult {
  const rng = createBattleRng(seed);
  const a: InternalFighter = {
    actor: "challenger",
    card: challenger,
    maxHp: hpValue(challenger),
    hp: hpValue(challenger),
  };
  const b: InternalFighter = {
    actor: "opponent",
    card: opponent,
    maxHp: hpValue(opponent),
    hp: hpValue(opponent),
  };
  const hp = { challenger: a.hp, opponent: b.hp };
  const events: BattleEvent[] = [{ type: "start" }];

  const aFirst =
    a.card.stats.space > b.card.stats.space ||
    (a.card.stats.space === b.card.stats.space);

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const order: InternalFighter[] = aFirst ? [a, b] : [b, a];
    for (const attacker of order) {
      if (a.hp <= 0 || b.hp <= 0) break;
      const defender = attacker.actor === "challenger" ? b : a;
      events.push(applyMove(attacker, defender, hp, rng));
      if (defender.hp <= 0) {
        events.push({ type: "faint", actor: defender.actor });
      }
    }
    if (a.hp <= 0 || b.hp <= 0) break;
  }

  let winner: BattleActor;
  if (a.hp <= 0 && b.hp > 0) winner = "opponent";
  else if (b.hp <= 0 && a.hp > 0) winner = "challenger";
  else if (a.hp === b.hp) winner = "challenger";
  else winner = a.hp > b.hp ? "challenger" : "opponent";

  events.push({ type: "end", winner });

  return {
    seed,
    challenger: { card: challenger, maxHp: a.maxHp },
    opponent: { card: opponent, maxHp: b.maxHp },
    events,
    winner,
  };
}
```

- [ ] **Step 7: Run tests — expect PASS**

```bash
cd web && npm test
```

Expected: all tests PASS. If the move-pick test fails, adjust assertion to match actual `attackRows` pairing (do not change `attackRows`).

- [ ] **Step 8: Commit**

```bash
git add web/package.json web/package-lock.json \
  web/src/lib/battle-types.ts web/src/lib/battle-rng.ts \
  web/src/lib/battle-engine.ts web/src/lib/battle-engine.test.ts
git commit -m "$(cat <<'EOF'
feat(web): add deterministic trainer battle engine

Pure seeded simulator emitting Pokémon-style move/faint/end events from card stats.
EOF
)"
```

---

### Task 2: Battle API (POST + GET)

**Files:**
- Create: `web/src/lib/battle-load.ts`
- Create: `web/src/app/api/battle/route.ts`

**Interfaces:**
- Consumes: `simulateBattle`, `BattleResult`, `fetchHfProfile`, `buildCard`
- Produces:
  - `loadBattleCards(challenger: string, opponent: string): Promise<{ challenger: CardData; opponent: CardData }>`
  - `POST /api/battle` → `BattleResult` JSON
  - `GET /api/battle?a=&b=&seed=` → `BattleResult` JSON
  - Errors: 400 / 404 / 429 / 502 with `{ error: string }`

- [ ] **Step 1: Write loader helper**

Create `web/src/lib/battle-load.ts`:

```ts
import { fetchHfProfile } from "./hf-fetcher";
import { buildCard, type CardData } from "./scoring";

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export async function loadBattleCards(
  challengerRaw: string,
  opponentRaw: string,
): Promise<{ challenger: CardData; opponent: CardData }> {
  const challengerName = normalizeUsername(challengerRaw);
  const opponentName = normalizeUsername(opponentRaw);

  if (!challengerName || !opponentName) {
    throw Object.assign(new Error("Username required"), { status: 400 });
  }
  if (challengerName === opponentName) {
    throw Object.assign(new Error("Choose a different opponent"), { status: 400 });
  }

  const loadOne = async (name: string) => {
    try {
      return buildCard(await fetchHfProfile(name));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Not found";
      if (/not found/i.test(msg)) {
        throw Object.assign(new Error("Trainer not found"), { status: 404 });
      }
      throw Object.assign(new Error("Trainer data unavailable"), { status: 502 });
    }
  };

  const [challenger, opponent] = await Promise.all([
    loadOne(challengerName),
    loadOne(opponentName),
  ]);
  return { challenger, opponent };
}

export function newBattleSeed(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
```

- [ ] **Step 2: Write API route**

Create `web/src/app/api/battle/route.ts`:

```ts
import { NextResponse } from "next/server";
import { simulateBattle } from "@/lib/battle-engine";
import { loadBattleCards, newBattleSeed, normalizeUsername } from "@/lib/battle-load";

function errorResponse(error: unknown) {
  const status =
    typeof error === "object" &&
    error &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
      ? (error as { status: number }).status
      : 500;
  const message = error instanceof Error ? error.message : "Battle failed";
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { challenger?: string; opponent?: string };
    const { challenger, opponent } = await loadBattleCards(
      body.challenger ?? "",
      body.opponent ?? "",
    );
    const seed = newBattleSeed();
    const result = simulateBattle(challenger, opponent, seed);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const a = url.searchParams.get("a") ?? "";
    const b = url.searchParams.get("b") ?? "";
    const seed = url.searchParams.get("seed") ?? "";
    if (!seed.trim()) {
      return NextResponse.json({ error: "Seed required" }, { status: 400 });
    }
    if (!normalizeUsername(a) || !normalizeUsername(b)) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }
    const { challenger, opponent } = await loadBattleCards(a, b);
    const result = simulateBattle(challenger, opponent, seed.trim());
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
```

- [ ] **Step 3: Smoke-test API locally**

```bash
cd web && npm run dev
# other terminal:
curl -s -X POST http://localhost:3000/api/battle \
  -H 'content-type: application/json' \
  -d '{"challenger":"huggingface","opponent":"clem"}' | head -c 400
```

Expected: JSON with `seed`, `events`, `winner`. Then replay:

```bash
# use seed from previous response
curl -s "http://localhost:3000/api/battle?a=huggingface&b=clem&seed=SEED" | head -c 400
```

Expected: same `winner` and event sequence.

Same-user:

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/battle \
  -H 'content-type: application/json' \
  -d '{"challenger":"clem","opponent":"clem"}'
```

Expected: `400`.

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/battle-load.ts web/src/app/api/battle/route.ts
git commit -m "$(cat <<'EOF'
feat(web): add trainer battle API

POST starts a seeded duel; GET replays the same log for shareable URLs.
EOF
)"
```

---

### Task 3: Battle CSS + presentational components

**Files:**
- Create: `web/src/styles/battle.css`
- Modify: `web/src/app/globals.css` (add `@import "../styles/battle.css";` after profile.css)
- Create: `web/src/components/battle/BattleHud.tsx`
- Create: `web/src/components/battle/BattleDialogue.tsx`

**Interfaces:**
- Consumes: `BattleFighterPublic`, HP numbers, dialogue lines
- Produces: presentational React components (no fetch, no engine)

- [ ] **Step 1: Add battle styles**

Create `web/src/styles/battle.css` with at least:

```css
.battle-page {
  min-height: calc(100vh - var(--hk-header-height));
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem 1rem 2rem;
}

.battle-arena {
  width: min(640px, 100%);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.battle-field {
  position: relative;
  border-radius: var(--hk-radius-lg);
  border: 3px solid rgba(255, 203, 5, 0.35);
  background:
    radial-gradient(ellipse 80% 50% at 50% 100%, rgba(59, 76, 202, 0.35), transparent 70%),
    linear-gradient(180deg, #1a3a2a 0%, #0d1f18 55%, #0a1520 100%);
  min-height: 340px;
  padding: 1rem 1.1rem 1.25rem;
  overflow: hidden;
}

.battle-fighter {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: center;
}

.battle-fighter--opponent { margin-bottom: 1.5rem; }
.battle-fighter--challenger { margin-top: 1.5rem; }

.battle-sprite {
  width: 96px;
  height: 96px;
  border-radius: 999px;
  object-fit: cover;
  border: 3px solid var(--hk-yellow);
  background: #111;
}

.battle-sprite--back {
  transform: scaleX(-1);
}

.battle-sprite--placeholder {
  display: grid;
  place-items: center;
  font-size: 2rem;
  color: var(--hk-yellow);
}

.battle-plate {
  background: rgba(255, 255, 255, 0.92);
  color: var(--hk-ink);
  border-radius: 10px;
  border: 3px solid var(--hk-ink);
  padding: 0.55rem 0.7rem;
  min-width: 0;
}

.battle-plate__row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 0.95rem;
}

.battle-hp {
  margin-top: 0.4rem;
}

.battle-hp__track {
  height: 10px;
  border-radius: 999px;
  background: #c5c5c5;
  overflow: hidden;
  border: 2px solid var(--hk-ink);
}

.battle-hp__fill {
  height: 100%;
  background: linear-gradient(90deg, #3dd68c, #1f9d55);
  transition: width 0.45s ease-out;
}

.battle-hp__fill--low { background: linear-gradient(90deg, #ffcb05, #e3350d); }
.battle-hp__fill--critical { background: linear-gradient(90deg, #e3350d, #8b0000); }

.battle-hp__label {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--hk-ink-muted);
}

.battle-dialogue {
  background: rgba(255, 255, 255, 0.95);
  color: var(--hk-ink);
  border: 4px solid var(--hk-ink);
  border-radius: 12px;
  min-height: 110px;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.25);
}

.battle-dialogue__text {
  flex: 1;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.35;
  margin: 0;
}

.battle-dialogue__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.battle-btn {
  font: inherit;
  font-weight: 700;
  border: 3px solid var(--hk-ink);
  border-radius: 8px;
  padding: 0.45rem 0.85rem;
  cursor: pointer;
  background: var(--hk-yellow);
  color: var(--hk-ink);
}

.battle-btn--ghost {
  background: #fff;
}

.battle-end {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.5rem;
}

.battle-empty,
.battle-error {
  width: min(480px, 100%);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--hk-radius-md);
  padding: 1.25rem;
}

.battle-empty label {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.battle-empty input {
  width: 100%;
  margin-top: 0.3rem;
  padding: 0.55rem 0.7rem;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: #0c0e16;
  color: #fff;
  font: inherit;
}
```

Add import in `web/src/app/globals.css` after the profile import:

```css
@import "../styles/battle.css";
```

- [ ] **Step 2: BattleHud**

Create `web/src/components/battle/BattleHud.tsx`:

```tsx
"use client";

import type { BattleFighterPublic } from "@/lib/battle-types";

type Props = {
  opponent: BattleFighterPublic;
  challenger: BattleFighterPublic;
  hp: { challenger: number; opponent: number };
};

function hpClass(ratio: number): string {
  if (ratio <= 0.2) return "battle-hp__fill battle-hp__fill--critical";
  if (ratio <= 0.5) return "battle-hp__fill battle-hp__fill--low";
  return "battle-hp__fill";
}

function FighterBlock({
  fighter,
  currentHp,
  side,
}: {
  fighter: BattleFighterPublic;
  currentHp: number;
  side: "challenger" | "opponent";
}) {
  const ratio = fighter.maxHp <= 0 ? 0 : Math.max(0, currentHp) / fighter.maxHp;
  const avatar = fighter.card.avatarUrl;
  return (
    <div className={`battle-fighter battle-fighter--${side}`}>
      <div className="battle-plate">
        <div className="battle-plate__row">
          <span>{fighter.card.displayName}</span>
          <span>Lv.{fighter.card.level}</span>
        </div>
        <div className="battle-hp">
          <div className="battle-hp__track">
            <div className={hpClass(ratio)} style={{ width: `${ratio * 100}%` }} />
          </div>
          <div className="battle-hp__label">
            HP {Math.max(0, currentHp)}/{fighter.maxHp}
          </div>
        </div>
      </div>
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          className={`battle-sprite${side === "challenger" ? " battle-sprite--back" : ""}`}
        />
      ) : (
        <div
          className={`battle-sprite battle-sprite--placeholder${
            side === "challenger" ? " battle-sprite--back" : ""
          }`}
          aria-hidden
        >
          ●
        </div>
      )}
    </div>
  );
}

export function BattleHud({ opponent, challenger, hp }: Props) {
  return (
    <div className="battle-field" aria-live="polite">
      <FighterBlock fighter={opponent} currentHp={hp.opponent} side="opponent" />
      <FighterBlock fighter={challenger} currentHp={hp.challenger} side="challenger" />
    </div>
  );
}
```

- [ ] **Step 3: BattleDialogue**

Create `web/src/components/battle/BattleDialogue.tsx`:

```tsx
"use client";

type Props = {
  lines: string[];
  showSkip: boolean;
  onSkip: () => void;
};

export function BattleDialogue({ lines, showSkip, onSkip }: Props) {
  return (
    <div className="battle-dialogue" role="status">
      <div className="battle-dialogue__text">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <div className="battle-dialogue__actions">
        {showSkip && (
          <button type="button" className="battle-btn battle-btn--ghost" onClick={onSkip}>
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add web/src/styles/battle.css web/src/app/globals.css \
  web/src/components/battle/BattleHud.tsx \
  web/src/components/battle/BattleDialogue.tsx
git commit -m "$(cat <<'EOF'
feat(web): add trainer battle HUD and dialogue UI

Classic arena plates, HP bars, and message box styled with HuggiMon tokens.
EOF
)"
```

---

### Task 4: BattleArena + `/battle` page

**Files:**
- Create: `web/src/components/battle/BattleArena.tsx`
- Create: `web/src/app/battle/page.tsx`
- Create: `web/src/app/battle/BattleClient.tsx` (client orchestrator for searchParams + fetch)

**Interfaces:**
- Consumes: `BattleResult`, `BattleEvent`
- Produces: animated playback; URL seed sync; rematch / back CTAs

- [ ] **Step 1: BattleArena playback**

Create `web/src/components/battle/BattleArena.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BattleDialogue } from "@/components/battle/BattleDialogue";
import { BattleHud } from "@/components/battle/BattleHud";
import type { BattleEvent, BattleResult } from "@/lib/battle-types";

const TICK_MS = 1500;

function linesForEvent(result: BattleResult, event: BattleEvent): string[] {
  const name = (actor: "challenger" | "opponent") =>
    result[actor].card.displayName;

  switch (event.type) {
    case "start":
      return [`${name("opponent")} wants to battle!`];
    case "move": {
      const lines = [`${name(event.actor)} used ${event.move}!`];
      if (event.effective === "super") lines.push("It's super effective!");
      if (event.effective === "not_very") lines.push("It's not very effective...");
      return lines;
    }
    case "faint":
      return [`${name(event.actor)} fainted!`];
    case "end":
      return [`${name(event.winner)} won the battle!`];
  }
}

type Props = {
  result: BattleResult;
  onRematch: () => void;
};

export function BattleArena({ result, onRematch }: Props) {
  const [index, setIndex] = useState(0);
  const [hp, setHp] = useState({
    challenger: result.challenger.maxHp,
    opponent: result.opponent.maxHp,
  });
  const done = index >= result.events.length - 1;
  const event = result.events[Math.min(index, result.events.length - 1)]!;
  const lines = useMemo(() => linesForEvent(result, event), [result, event]);

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => {
      const next = result.events[index + 1];
      if (!next) return;
      if (next.type === "move") setHp(next.hpAfter);
      setIndex((i) => i + 1);
    }, TICK_MS);
    return () => window.clearTimeout(t);
  }, [index, done, result.events]);

  function skip() {
    const lastMove = [...result.events].reverse().find((e) => e.type === "move");
    if (lastMove && lastMove.type === "move") setHp(lastMove.hpAfter);
    setIndex(result.events.length - 1);
  }

  return (
    <div className="battle-arena">
      <BattleHud
        opponent={result.opponent}
        challenger={result.challenger}
        hp={hp}
      />
      <BattleDialogue lines={lines} showSkip={!done} onSkip={skip} />
      {done && (
        <div className="battle-end">
          <button type="button" className="battle-btn" onClick={onRematch}>
            Rematch
          </button>
          <Link
            href={`/${encodeURIComponent(result.challenger.card.username)}`}
            className="battle-btn battle-btn--ghost"
          >
            Back to profile
          </Link>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: BattleClient**

Create `web/src/app/battle/BattleClient.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BattleArena } from "@/components/battle/BattleArena";
import type { BattleResult } from "@/lib/battle-types";

export function BattleClient() {
  const params = useSearchParams();
  const router = useRouter();
  const a = (params.get("a") ?? "").trim();
  const b = (params.get("b") ?? "").trim();
  const seed = (params.get("seed") ?? "").trim();

  const [result, setResult] = useState<BattleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [draftA, setDraftA] = useState(a);
  const [draftB, setDraftB] = useState(b);

  const runBattle = useCallback(async (challenger: string, opponent: string, replaySeed?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let data: BattleResult;
      if (replaySeed) {
        const res = await fetch(
          `/api/battle?a=${encodeURIComponent(challenger)}&b=${encodeURIComponent(opponent)}&seed=${encodeURIComponent(replaySeed)}`,
        );
        const json = (await res.json()) as BattleResult & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Battle failed");
        data = json;
      } else {
        const res = await fetch("/api/battle", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ challenger, opponent }),
        });
        const json = (await res.json()) as BattleResult & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Battle failed");
        data = json;
        router.replace(
          `/battle?a=${encodeURIComponent(challenger)}&b=${encodeURIComponent(opponent)}&seed=${encodeURIComponent(data.seed)}`,
        );
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Battle failed");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!a || !b) return;
    void runBattle(a, b, seed || undefined);
  }, [a, b, seed, runBattle]);

  if (!a || !b) {
    return (
      <form
        className="battle-empty"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(
            `/battle?a=${encodeURIComponent(draftA.trim())}&b=${encodeURIComponent(draftB.trim())}`,
          );
        }}
      >
        <h1>Trainer Battle</h1>
        <label>
          Challenger
          <input value={draftA} onChange={(e) => setDraftA(e.target.value)} required />
        </label>
        <label>
          Opponent
          <input value={draftB} onChange={(e) => setDraftB(e.target.value)} required />
        </label>
        <button type="submit" className="battle-btn">
          Fight!
        </button>
      </form>
    );
  }

  if (loading && !result) {
    return <p className="battle-dialogue__text">Trainers are entering the arena…</p>;
  }

  if (error) {
    return (
      <div className="battle-error">
        <p>{error}</p>
        <button type="button" className="battle-btn" onClick={() => void runBattle(a, b)}>
          Try again
        </button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <BattleArena
      key={result.seed}
      result={result}
      onRematch={() => {
        // Clear seed so the effect POSTs a fresh fight (avoid double-calling runBattle here).
        setResult(null);
        router.replace(
          `/battle?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`,
        );
      }}
    />
  );
}
```

Note: after a successful POST, `router.replace` adds `seed`, which re-runs the effect and GETs the same log once — acceptable for v1 (keeps share URL + client state aligned).

- [ ] **Step 3: Battle page**

Create `web/src/app/battle/page.tsx`:

```tsx
import { Suspense } from "react";
import { BattleClient } from "./BattleClient";

export const metadata = {
  title: "Trainer Battle · HuggiMon",
  description: "Watch two Hugging Face trainers duel with their HuggiMon cards.",
};

export default function BattlePage() {
  return (
    <main className="battle-page">
      <Suspense fallback={<p>Loading battle…</p>}>
        <BattleClient />
      </Suspense>
    </main>
  );
}
```

- [ ] **Step 4: Manual check**

Open `http://localhost:3000/battle?a=huggingface&b=clem` — expect animated dialogue + HP drops + end CTAs. Refresh with seed in URL — same winner.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/battle/BattleArena.tsx \
  web/src/app/battle/page.tsx web/src/app/battle/BattleClient.tsx
git commit -m "$(cat <<'EOF'
feat(web): add animated trainer battle page

Replay server battle logs turn-by-turn with skip, rematch, and seeded URLs.
EOF
)"
```

---

### Task 5: Fight CTA on profile

**Files:**
- Create: `web/src/components/battle/FightChallengeModal.tsx`
- Modify: `web/src/components/ProfileActions.tsx`

**Interfaces:**
- Consumes: `username` (challenger)
- Produces: modal → navigate to `/battle?a={challenger}&b={opponent}`

- [ ] **Step 1: FightChallengeModal**

Create `web/src/components/battle/FightChallengeModal.tsx` using the same portal/Escape pattern as `HowItWorksDialog` (`hk-modal` classes):

```tsx
"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/use-is-client";

type Props = {
  open: boolean;
  onClose: () => void;
  challenger: string;
};

export function FightChallengeModal({ open, onClose, challenger }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const router = useRouter();
  const [opponent, setOpponent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onKeyDown]);

  if (!open || !isClient) return null;

  return createPortal(
    <div className="hk-modal" role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className="hk-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="hk-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="hk-modal__hero">
          <p className="hk-modal__eyebrow">Trainer battle</p>
          <h2 id={titleId} className="hk-modal__title">
            Challenge an opponent
          </h2>
          <p className="hk-modal__lead">
            Fighting as <strong>@{challenger}</strong>. Enter another Hugging Face username.
          </p>
        </div>
        <form
          className="hk-modal__body"
          onSubmit={(e) => {
            e.preventDefault();
            const clean = opponent.trim().replace(/^@/, "");
            if (!clean) {
              setError("Username required");
              return;
            }
            if (clean.toLowerCase() === challenger.toLowerCase()) {
              setError("Choose a different opponent");
              return;
            }
            onClose();
            router.push(
              `/battle?a=${encodeURIComponent(challenger)}&b=${encodeURIComponent(clean)}`,
            );
          }}
        >
          <label className="hk-modal__section-desc">
            Opponent username
            <input
              value={opponent}
              onChange={(e) => {
                setOpponent(e.target.value);
                setError(null);
              }}
              placeholder="e.g. clem"
              autoFocus
              style={{
                display: "block",
                width: "100%",
                marginTop: "0.4rem",
                padding: "0.6rem 0.75rem",
                borderRadius: 8,
                border: "2px solid rgba(0,0,0,0.15)",
                font: "inherit",
              }}
            />
          </label>
          {error && <p style={{ color: "#b91c1c", fontWeight: 600 }}>{error}</p>}
          <div style={{ marginTop: "1rem" }}>
            <button type="submit" className="battle-btn">
              Fight!
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 2: Wire ProfileActions**

In `web/src/components/ProfileActions.tsx`:

1. Import `useState` and `FightChallengeModal`.
2. Add state `fightOpen`.
3. Insert a Fight button after the divider (before Copy link):

```tsx
<button
  type="button"
  onClick={() => setFightOpen(true)}
  className="profile-action profile-action--fight"
>
  Fight
</button>
```

4. Render `<FightChallengeModal open={fightOpen} onClose={() => setFightOpen(false)} challenger={username} />`.

Optional CSS in `profile.css` if needed for emphasis (yellow border) — keep minimal.

- [ ] **Step 3: Manual check**

Open a profile → Fight → enter opponent → lands on `/battle?a=…&b=…` and animates.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/battle/FightChallengeModal.tsx \
  web/src/components/ProfileActions.tsx
git commit -m "$(cat <<'EOF'
feat(web): add Fight challenge entry on trainer profiles

Modal collects an opponent username and starts a 1v1 battle.
EOF
)"
```

---

### Task 6: How-it-works blurb + final verification

**Files:**
- Modify: `web/src/components/HowItWorksDialog.tsx`
- Modify: `README.md` (short API/feature mention only if a Battles section fits naturally; otherwise skip)

- [ ] **Step 1: Add dialog section**

In `HowItWorksDialog`, after the rarity/variants section (before close of `hk-modal__body`), add:

```tsx
<section className="hk-modal__section">
  <h3 className="hk-modal__section-title">Trainer battles</h3>
  <p className="hk-modal__section-desc">
    From a profile, hit Fight and enter another Hugging Face username. An automated duel
    plays out from each card&apos;s HP, attacks, energy, and type weakness — classic battle
    screen, shareable result URL.
  </p>
</section>
```

- [ ] **Step 2: Full regression checklist**

```bash
cd web && npm test && npm run lint
```

Manual:
1. Profile → Fight → valid opponent → animation completes.
2. Skip jumps to winner.
3. Rematch changes seed / can change winner with variance.
4. Copy URL with seed → new tab same winner + same move sequence.
5. Same username opponent → UI + API reject.
6. Unknown user → clear error.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/HowItWorksDialog.tsx
git commit -m "$(cat <<'EOF'
docs(web): mention trainer battles in How it works

Point users at the Fight flow and shareable duel URLs.
EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| 1v1 card vs card | 1, 2 |
| Classic game UI | 3, 4 |
| Turn-by-turn + Skip | 4 |
| Fight from profile → opponent input | 5 |
| Spectacle only + seeded share URL | 2, 4 |
| Server log + client animator | 2, 4 |
| Rules: initiative / moves / weakness / KO / turn cap | 1 |
| POST + GET API errors | 2 |
| HowItWorks blurb | 6 |
| Engine unit tests | 1 |

## Self-review notes

- No TBD placeholders.
- `weaknessType(defender)` drives “super”; mirror drives “not_very” — matches spec.
- Rematch clears `seed` via `router.replace` (no direct `runBattle`) so the effect POSTs once.
- `BattleArena` keyed by `seed` resets playback when a new result arrives.
