"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  large?: boolean;
  defaultValue?: string;
};

export function ProfileSearch({ large, defaultValue = "" }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState(defaultValue);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, "");
    if (clean) router.push(`/${encodeURIComponent(clean)}`);
  }

  return (
    <form onSubmit={onSubmit} className="hk-search">
      <div className="hk-search__field">
        <span className="hk-search__at" aria-hidden>
          @
        </span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your-hf-username"
          className="hk-search__input"
          autoComplete="username"
          autoFocus={large}
        />
      </div>
      <button type="submit" className="hk-search__btn">
        Open binder
      </button>
    </form>
  );
}
