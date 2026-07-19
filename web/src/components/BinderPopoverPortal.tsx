"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "@/hooks/use-is-client";
import { usePopupAnchor } from "@/hooks/use-popup-anchor";
import type { PopupAnchor } from "@/lib/popover-anchor";

type Props = {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  pageUrl?: string;
  onClose: () => void;
  children?: React.ReactNode;
};

function linkTop(anchor: PopupAnchor): number {
  const raw = anchor.top + anchor.height + 20;
  const maxTop = window.innerHeight - 40;
  return Math.min(raw, maxTop);
}

function PopoverLink({
  anchor,
  pageUrl,
}: {
  anchor: PopupAnchor;
  pageUrl: string;
}) {
  const external = pageUrl.startsWith("http");

  return (
    <a
      href={pageUrl}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="hpk-card-popup__link hk-how-link"
      style={{
        top: linkTop(anchor),
        left: anchor.left,
      }}
    >
      go to page
      <svg className="hk-how-link__arrow" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 12h12M13 8l4 4-4 4"
        />
      </svg>
    </a>
  );
}

export function BinderPopoverPortal({ open, anchorRef, pageUrl, onClose, children }: Props) {
  const isClient = useIsClient();
  const anchor = usePopupAnchor(anchorRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!isClient || !open) return null;

  const showLink = Boolean(pageUrl && anchor.height > 4);

  return createPortal(
    <>
      <button
        type="button"
        className="hpk-card-popup__scrim"
        aria-label="Close card"
        onClick={onClose}
      />
      {children}
      {showLink && <PopoverLink anchor={anchor} pageUrl={pageUrl!} />}
    </>,
    document.body,
  );
}
