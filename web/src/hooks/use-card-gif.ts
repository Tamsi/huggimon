"use client";

import { useCallback, useState, type RefObject } from "react";
import {
  captureCardGif,
  downloadBlob,
  openBlobInTab,
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

  const downloadGif = useCallback(async () => {
    try {
      const blob = await renderGif();
      downloadBlob(blob, `${username}-huggimon.gif`);
      notify("GIF downloaded");
    } catch {
      notify("Capture failed — try again");
    }
  }, [renderGif, username, notify]);

  const copyGif = useCallback(async () => {
    try {
      const blob = await renderGif();
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        downloadBlob(blob, `${username}-huggimon.gif`);
        notify("Clipboard unavailable — GIF downloaded");
        return;
      }
      await navigator.clipboard.write([
        new ClipboardItem({ "image/gif": blob }),
      ]);
      notify("GIF copied");
    } catch {
      notify("Copy failed — try Download GIF");
    }
  }, [renderGif, username, notify]);

  const openGif = useCallback(async () => {
    try {
      const blob = await renderGif();
      openBlobInTab(blob);
    } catch {
      notify("Capture failed — try again");
    }
  }, [renderGif, notify]);

  const shareGif = useCallback(async () => {
    try {
      const blob = await renderGif();
      const file = new File([blob], `${username}-huggimon.gif`, {
        type: "image/gif",
      });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${username} — HuggiMon trainer card`,
        });
        notify("Shared");
        return;
      }
      if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/gif": blob }),
        ]);
        notify("GIF copied");
        return;
      }
      downloadBlob(blob, `${username}-huggimon.gif`);
      notify("Share unavailable — GIF downloaded");
    } catch {
      notify("Share failed");
    }
  }, [renderGif, username, notify]);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(profileUrl);
    notify("Link copied");
  }, [profileUrl, notify]);

  return {
    busy,
    toast,
    copyLink,
    downloadGif,
    copyGif,
    openGif,
    shareGif,
  };
}
