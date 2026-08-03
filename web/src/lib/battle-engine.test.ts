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

  it("picks the cheapest move when none are affordable", () => {
    const card = mockCard({
      username: "broke",
      type: "Normal",
      energyCount: 0,
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
    const result = simulateBattle(card, fodder, "move-cheapest");
    const move = result.events.find((e) => e.type === "move" && e.actor === "challenger");
    assert.ok(move && move.type === "move");
    // model=90 → damage 90, cost 3; data=30 → damage 30, cost 1 — none affordable at energy 0
    assert.equal(move.move, "Small Hit");
  });
});
