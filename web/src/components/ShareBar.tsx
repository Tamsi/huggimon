"use client";

import { useCallback, useState } from "react";

type Props = {
  username: string;
  displayName: string;
  profileUrl: string;
  faceUrl: string;
};

function shareText(displayName: string): string {
  return `Check out my HuggiMon trainer card — ${displayName} on Hugging Face`;
}

export function ShareBar({
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
    notify("Link copied!");
  }, [profileUrl, notify]);

  const copyImage = useCallback(async () => {
    try {
      const res = await fetch(faceUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      notify("Image copied!");
    } catch {
      notify("Could not copy image — try Download");
    }
  }, [faceUrl, notify]);

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText(displayName))}&url=${encodeURIComponent(profileUrl)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;

  return (
    <>
      <p className="hk-share__title">Share my card</p>
      <div className="hk-share__grid">
        <button type="button" onClick={copyLink} className="hk-share__btn">
          Copy link
        </button>
        <a href={xUrl} target="_blank" rel="noreferrer" className="hk-share__btn">
          𝕏 Post
        </a>
        <a href={linkedInUrl} target="_blank" rel="noreferrer" className="hk-share__btn">
          LinkedIn
        </a>
        <a
          href={faceUrl}
          download={`${username}-huggimon.png`}
          className="hk-share__btn"
        >
          Download
        </a>
        <button type="button" onClick={copyImage} className="hk-share__btn">
          Copy image
        </button>
        <a
          href={`${faceUrl}?story=1`}
          target="_blank"
          rel="noreferrer"
          className="hk-share__btn"
        >
          Story format
        </a>
      </div>
      {toast && (
        <div role="status" className="hk-toast">
          {toast}
        </div>
      )}
    </>
  );
}
