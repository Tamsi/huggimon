"use client";

import { useEffect, useState } from "react";

type Props = {
  text: string;
  showRun: boolean;
  onRun: () => void;
  typingDone: boolean;
  onTypingDone: () => void;
};

const CHAR_MS = 28;

export function BattleDialogue({
  text,
  showRun,
  onRun,
  typingDone,
  onTypingDone,
}: Props) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    setShown("");
    if (!text) {
      onTypingDone();
      return;
    }

    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        onTypingDone();
      }
    }, CHAR_MS);

    return () => window.clearInterval(id);
  }, [text, onTypingDone]);

  return (
    <div className="battle-bottom">
      <div className="battle-dialogue" role="status">
        <p className="battle-dialogue__text">{shown}</p>
        {typingDone && <span className="battle-dialogue__caret" aria-hidden />}
      </div>
      <div className="battle-menu" aria-label="Battle commands">
        <button type="button" className="battle-menu__btn battle-menu__btn--fight" disabled>
          Fight
        </button>
        <button type="button" className="battle-menu__btn battle-menu__btn--bag" disabled>
          Bag
        </button>
        <button type="button" className="battle-menu__btn battle-menu__btn--party" disabled>
          Pokémon
        </button>
        <button
          type="button"
          className="battle-menu__btn battle-menu__btn--run"
          disabled={!showRun}
          onClick={onRun}
        >
          {showRun ? "Skip" : "Run"}
        </button>
      </div>
    </div>
  );
}
