"use client";

import { useCallback, useState } from "react";
import { GITHUB_REPO } from "@/lib/site";

type Props = {
  username: string;
  displayName: string;
  profileUrl: string;
  faceUrl: string;
};

function shareText(displayName: string): string {
  return `Check out my HuggiMon trainer card — ${displayName} on Hugging Face`;
}

export function ProfileActions({
  username,
  displayName,
  profileUrl,
  faceUrl,
}: Props) {
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(profileUrl);
    notify("Link copied");
  }, [profileUrl, notify]);

  const copyImage = useCallback(async () => {
    try {
      const res = await fetch(faceUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      notify("Image copied");
    } catch {
      notify("Copy failed — try Download");
    }
  }, [faceUrl, notify]);

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

      <button type="button" onClick={copyLink} className="profile-action">
        Copy link
      </button>
      <a href={xUrl} target="_blank" rel="noreferrer" className="profile-action">
        Share on 𝕏
      </a>
      <a href={linkedInUrl} target="_blank" rel="noreferrer" className="profile-action">
        LinkedIn
      </a>
      <a
        href={faceUrl}
        download={`${username}-huggimon.png`}
        className="profile-action"
      >
        Download PNG
      </a>
      <button type="button" onClick={copyImage} className="profile-action">
        Copy image
      </button>
      <a
        href={`${faceUrl}?story=1`}
        target="_blank"
        rel="noreferrer"
        className="profile-action"
      >
        Story format
      </a>

      {toast && (
        <div role="status" className="profile-toast">
          {toast}
        </div>
      )}
    </div>
  );
}
