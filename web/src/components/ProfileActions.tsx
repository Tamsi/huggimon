"use client";

import { type RefObject, useState } from "react";
import { FightChallengeModal } from "@/components/battle/FightChallengeModal";
import { useCardGif } from "@/hooks/use-card-gif";
import { GITHUB_REPO } from "@/lib/site";

type Props = {
  cardRef: RefObject<HTMLElement | null>;
  username: string;
  displayName: string;
  profileUrl: string;
};

function shareText(displayName: string): string {
  return `Check out my HuggiMon trainer card — ${displayName} on Hugging Face`;
}

export function ProfileActions({
  cardRef,
  username,
  displayName,
  profileUrl,
}: Props) {
  const [fightOpen, setFightOpen] = useState(false);
  const { busy, toast, copyLink, downloadCard, copyCard } = useCardGif(
    cardRef,
    username,
    profileUrl,
  );

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText(displayName))}&url=${encodeURIComponent(profileUrl)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;

  return (
    <div className="profile-actions">
      <a
        href={GITHUB_REPO}
        target="_blank"
        rel="noreferrer"
        className="profile-action profile-action--github"
      >
        <span className="profile-action__icon" aria-hidden>
          ★
        </span>
        Star on GitHub
      </a>

      <div className="profile-actions__divider" />

      <button
        type="button"
        onClick={() => setFightOpen(true)}
        className="profile-action profile-action--fight"
      >
        Fight
      </button>

      <button type="button" onClick={() => void copyLink()} className="profile-action">
        Copy link
      </button>
      <a href={xUrl} target="_blank" rel="noreferrer" className="profile-action">
        Share on 𝕏
      </a>
      <a href={linkedInUrl} target="_blank" rel="noreferrer" className="profile-action">
        LinkedIn
      </a>
      <button
        type="button"
        onClick={() => void downloadCard()}
        disabled={busy}
        className="profile-action"
      >
        {busy ? "Capturing holo…" : "Download Card"}
      </button>
      <button
        type="button"
        onClick={() => void copyCard()}
        disabled={busy}
        className="profile-action"
      >
        Copy Card
      </button>

      {toast && (
        <div role="status" className="profile-toast">
          {toast}
        </div>
      )}

      <FightChallengeModal
        open={fightOpen}
        onClose={() => setFightOpen(false)}
        challenger={username}
      />
    </div>
  );
}
