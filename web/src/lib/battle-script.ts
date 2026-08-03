import type { BattleActor, BattleEvent, BattleResult } from "./battle-types";

export type BattleFx =
  | "idle"
  | "hit-opponent"
  | "hit-challenger"
  | "faint-opponent"
  | "faint-challenger"
  | "send-out";

export type BattleBeat = {
  text: string;
  fx: BattleFx;
  hpAfter?: { challenger: number; opponent: number };
  holdMs: number;
};

function nameOf(result: BattleResult, actor: BattleActor): string {
  return result[actor].card.displayName;
}

/** Expand engine events into Pokémon-style dialogue beats. */
export function buildBattleScript(result: BattleResult): BattleBeat[] {
  const beats: BattleBeat[] = [];
  let sentOut = false;

  for (const event of result.events) {
    switch (event.type) {
      case "start":
        beats.push({
          text: `Trainer ${nameOf(result, "opponent")} would like to battle!`,
          fx: "idle",
          holdMs: 2200,
        });
        break;
      case "move": {
        if (!sentOut) {
          beats.push({
            text: `Go! ${nameOf(result, "challenger")}!`,
            fx: "send-out",
            holdMs: 1600,
          });
          sentOut = true;
        }
        const target: BattleActor =
          event.actor === "challenger" ? "opponent" : "challenger";
        beats.push({
          text: `${nameOf(result, event.actor)} used\n${event.move.toUpperCase()}!`,
          fx: target === "opponent" ? "hit-opponent" : "hit-challenger",
          hpAfter: event.hpAfter,
          holdMs: 1800,
        });
        if (event.critical) {
          beats.push({
            text: "A critical hit!",
            fx: "idle",
            holdMs: 1400,
          });
        }
        if (event.effective === "super") {
          beats.push({
            text: "It's super effective!",
            fx: "idle",
            holdMs: 1500,
          });
        } else if (event.effective === "not_very") {
          beats.push({
            text: "It's not very effective...",
            fx: "idle",
            holdMs: 1500,
          });
        }
        break;
      }
      case "faint":
        beats.push({
          text: `${nameOf(result, event.actor)}\nfainted!`,
          fx:
            event.actor === "opponent" ? "faint-opponent" : "faint-challenger",
          holdMs: 2000,
        });
        break;
      case "end":
        beats.push({
          text:
            event.winner === "challenger"
              ? `${nameOf(result, "challenger")} defeated\n${nameOf(result, "opponent")}!`
              : `${nameOf(result, "opponent")} defeated\n${nameOf(result, "challenger")}!`,
          fx: "idle",
          holdMs: 2400,
        });
        break;
    }
  }

  return beats;
}
