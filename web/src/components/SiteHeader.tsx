import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="hk-header site-header">
      <div className="hk-header__inner">
        <Link href="/" className="hk-logo">
          <span className="hk-logo__mark" aria-hidden>
            H
          </span>
          <span className="hk-logo__text">
            Huggi<span>Mon</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
