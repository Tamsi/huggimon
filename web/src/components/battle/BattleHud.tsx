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
    <div className="battle-field">
      <FighterBlock fighter={opponent} currentHp={hp.opponent} side="opponent" />
      <FighterBlock fighter={challenger} currentHp={hp.challenger} side="challenger" />
    </div>
  );
}
