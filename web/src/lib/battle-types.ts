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
      critical: boolean;
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
