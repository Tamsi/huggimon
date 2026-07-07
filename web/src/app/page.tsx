import Link from "next/link";
import { HomeCardStack } from "@/components/HomeCardStack";
import { ProfileSearch } from "@/components/ProfileSearch";
import { getHomeShowcaseCards } from "@/lib/home-showcase";

const EXAMPLES = [
  { username: "ImTamsi", label: "ImTamsi" },
  { username: "lysandre", label: "lysandre" },
  { username: "lhoestq", label: "lhoestq" },
  { username: "Kandil7", label: "Kandil7" },
] as const;

const FEATURES = [
  {
    title: "Stats → level",
    body: "Models, datasets, spaces, and community activity become HP, attacks, and rarity.",
  },
  {
    title: "14 holo tiers",
    body: "From reverse holo to Secret Gold — the higher your HF level, the rarer the foil.",
  },
  {
    title: "Binder & share",
    body: "Flip through follower cards, download holo GIFs, and share your trainer page.",
  },
] as const;

export const revalidate = 3600;

export default async function Home() {
  const showcaseCards = await getHomeShowcaseCards();

  return (
    <div className="hk-shell hk-home-shell hk-home-landing">
      <main className="hk-main hk-home">
        <section className="hk-home-hero">
          <div className="hk-home-hero__inner">
            <div className="hk-home-hero__grid">
            <div className="hk-home-hero__copy">
              <p className="hk-home-hero__eyebrow">Hugging Face × Pokémon TCG</p>
              <h1 className="hk-home-hero__title">
                Turn any HF profile into a holo trainer card
              </h1>
              <p className="hk-home-hero__lead">
                Paste a Hugging Face @username to generate a collectible card with
                live tilt, holo shaders, and a binder of followers.
              </p>

              <div className="hk-home-hero__search">
                <ProfileSearch hero />
              </div>

              <div className="hk-home-hero__examples">
                <span className="hk-home-hero__examples-label">Try</span>
                <ul className="hk-home-hero__chips">
                  {EXAMPLES.map(({ username, label }) => (
                    <li key={username}>
                      <Link href={`/${encodeURIComponent(username)}`} className="hk-home-chip">
                        @{label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="hk-home-hero__stage">
              <HomeCardStack cards={showcaseCards} />
            </div>
          </div>
          </div>
        </section>

        <section className="hk-home-features" aria-label="Features">
          <ul className="hk-home-features__grid">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="hk-home-feature">
                <h2 className="hk-home-feature__title">{feature.title}</h2>
                <p className="hk-home-feature__body">{feature.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="hk-footer">
        Not affiliated with Pokémon or Hugging Face · Holo stack by{" "}
        <a
          href="https://github.com/simeydotme/pokemon-cards-css"
          target="_blank"
          rel="noreferrer"
          className="hk-footer__link"
        >
          pokemon-cards-css
        </a>
      </footer>
    </div>
  );
}
