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
