"use client";

import { useState } from "react";
import { GITHUB_REPO } from "@/lib/site";
import { HowItWorksDialog } from "./HowItWorksDialog";

function GitHubIcon() {
  return (
    <svg className="hk-github-btn__icon" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.776.418-1.305.762-1.606-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.807 5.624-5.48 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.694.825.576C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="hk-github-btn__star" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M12 2l2.9 6.26 6.8.59-5.15 4.46 1.55 6.64L12 17.77 5.9 20.95l1.55-6.64L2.3 8.85l6.8-.59L12 2z"
      />
    </svg>
  );
}

type Props = {
  starsLabel: string | null;
  stars: number | null;
};

export function HeaderNav({ starsLabel, stars }: Props) {
  const [howOpen, setHowOpen] = useState(false);

  return (
    <>
      <nav className="hk-header__nav" aria-label="Site">
        <button
          type="button"
          className="hk-how-link"
          onClick={() => setHowOpen(true)}
          aria-haspopup="dialog"
        >
          how it works
          <svg className="hk-how-link__arrow" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 17 17 7M9 7h8v8"
            />
          </svg>
        </button>

        <a
          href={GITHUB_REPO}
          target="_blank"
          rel="noreferrer"
          className="hk-github-btn"
        >
          <GitHubIcon />
          <span className="hk-github-btn__label">Star on GitHub</span>
          {starsLabel !== null && (
            <span className="hk-github-btn__count" aria-label={`${stars} stars`}>
              <StarIcon />
              {starsLabel}
            </span>
          )}
        </a>
      </nav>

      <HowItWorksDialog open={howOpen} onClose={() => setHowOpen(false)} />
    </>
  );
}
