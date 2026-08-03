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
