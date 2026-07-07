"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  large?: boolean;
  hero?: boolean;
  defaultValue?: string;
};

export function ProfileSearch({ large, hero, defaultValue = "" }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState(defaultValue);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, "");
    if (clean) router.push(`/${encodeURIComponent(clean)}`);
  }

  const className = [
    "hk-search",
    hero ? "hk-search--hero" : "",
    large ? "hk-search--large" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const submitLabel = hero ? "Open card" : "Open binder";

  return (
    <form onSubmit={onSubmit} className={className} aria-label="Search Hugging Face username">
      <div className="hk-search__field">
        <span className="hk-search__at" aria-hidden>
          @
        </span>
        <input
          type="search"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="huggingface-username"
          className="hk-search__input"
          autoComplete="username"
          autoFocus={large || hero}
          enterKeyHint="go"
        />
      </div>
      <button type="submit" className="hk-search__btn">
        {submitLabel}
      </button>
    </form>
  );
}
