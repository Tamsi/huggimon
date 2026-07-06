"use client";

import { useCallback, useState, type RefObject } from "react";
import {
  captureCardGif,
  captureCardPng,
  downloadBlob,
} from "@/lib/capture-card-gif";

export function useCardGif(
  cardRef: RefObject<HTMLElement | null>,
  username: string,
  profileUrl: string,
) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const renderGif = useCallback(async () => {
    const root = cardRef.current;
    if (!root) throw new Error("Card not ready");
    setBusy(true);
    try {
      return await captureCardGif(root);
    } finally {
      setBusy(false);
    }
  }, [cardRef]);

  const downloadCard = useCallback(async () => {
    try {
      const blob = await renderGif();
      downloadBlob(blob, `${username}-huggimon.gif`);
      notify("Card downloaded");
    } catch {
      notify("Capture failed — try again");
    }
  }, [renderGif, username, notify]);

  const copyCard = useCallback(() => {
    const root = cardRef.current;
    if (!root) {
      notify("Card not ready — try again");
      return;
    }

    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      void (async () => {
        setBusy(true);
        try {
          const blob = await captureCardPng(root);
          downloadBlob(blob, `${username}-huggimon.png`);
          notify("Clipboard unavailable — card downloaded");
        } catch {
          notify("Capture failed — try again");
        } finally {
          setBusy(false);
        }
      })();
      return;
    }

    setBusy(true);
    const pngPromise = captureCardPng(root);

    void navigator.clipboard
      .write([
        new ClipboardItem({
          "image/png": pngPromise,
        }),
      ])
      .then(() => notify("Card copied"))
      .catch(() => notify("Copy failed — try Download Card"))
      .finally(() => setBusy(false));
  }, [cardRef, username, notify]);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(profileUrl);
    notify("Link copied");
  }, [profileUrl, notify]);

  return {
    busy,
    toast,
    copyLink,
    downloadCard,
    copyCard,
  };
}
