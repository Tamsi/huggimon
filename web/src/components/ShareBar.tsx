"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { useCardGif } from "@/hooks/use-card-gif";

type Props = {
  username: string;
  displayName: string;
  profileUrl: string;
  cardRef: RefObject<HTMLElement | null>;
};

function shareText(displayName: string): string {
  return `Check out my HuggiMon trainer card — ${displayName} on Hugging Face`;
}

export function ShareBar({
  username,
  displayName,
  profileUrl,
  cardRef,
}: Props) {
  const { busy, toast, copyLink, downloadCard, copyCard } = useCardGif(
    cardRef,
    username,
    profileUrl,
  );

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText(displayName))}&url=${encodeURIComponent(profileUrl)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;

  return (
    <>
      <p className="hk-share__title">Share my card</p>
      <div className="hk-share__grid">
        <button type="button" onClick={() => void copyLink()} className="hk-share__btn">
          Copy link
        </button>
        <a href={xUrl} target="_blank" rel="noreferrer" className="hk-share__btn">
          𝕏 Post
        </a>
        <a href={linkedInUrl} target="_blank" rel="noreferrer" className="hk-share__btn">
          LinkedIn
        </a>
        <button
          type="button"
          onClick={() => void downloadCard()}
          disabled={busy}
          className="hk-share__btn"
        >
          {busy ? "Capturing…" : "Download Card"}
        </button>
        <button
          type="button"
          onClick={() => void copyCard()}
          disabled={busy}
          className="hk-share__btn"
        >
          Copy Card
        </button>
      </div>
      {toast && (
        <div role="status" className="hk-toast">
          {toast}
        </div>
      )}
    </>
  );
}

/** Wrapper when the card lives in a sibling container. */
export function ShareBarWithCard({
  username,
  displayName,
  profileUrl,
  children,
}: Omit<Props, "cardRef"> & { children: ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={cardRef}>{children}</div>
      <ShareBar
        cardRef={cardRef}
        username={username}
        displayName={displayName}
        profileUrl={profileUrl}
      />
    </>
  );
}
