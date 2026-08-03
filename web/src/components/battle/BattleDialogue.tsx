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
