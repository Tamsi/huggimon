import Image from "next/image";
import Link from "next/link";
import { fetchGitHubStars, formatStarCount } from "@/lib/github-stars";
import { HeaderNav } from "./HeaderNav";

export async function SiteHeader() {
  const stars = await fetchGitHubStars();
  const starsLabel = stars !== null ? formatStarCount(stars) : null;

  return (
    <header className="hk-header site-header">
      <div className="hk-header__inner">
        <Link href="/" className="hk-logo">
          <Image
            src="/brand/huggimon-logo.png"
            alt="HuggiMon"
            width={1024}
            height={566}
            className="hk-logo__img"
            priority
          />
        </Link>

        <HeaderNav starsLabel={starsLabel} stars={stars} />
      </div>
    </header>
  );
}
