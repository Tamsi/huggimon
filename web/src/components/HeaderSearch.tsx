"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function HeaderSearch() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, "");
    if (clean) router.push(`/${encodeURIComponent(clean)}`);
  }

  return (
    <form className="hk-header-search" onSubmit={onSubmit} aria-label="Search Hugging Face username">
      <div className="hk-header-search__bar">
        <span className="hk-header-search__prefix" aria-hidden>
          @
        </span>
        <input
          type="search"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="huggingface username"
          className="hk-header-search__input"
          autoComplete="username"
          enterKeyHint="go"
          spellCheck={false}
        />
        <button type="submit" className="hk-header-search__submit" aria-label="Open trainer card">
          <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12h12M13 6l6 6-6 6"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
