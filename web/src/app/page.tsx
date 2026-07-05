import { ProfileSearch } from "@/components/ProfileSearch";

export default function Home() {
  return (
    <div className="hk-shell hk-desk hk-body">
      <main className="hk-main hk-home">
        <div className="hk-home__binder-deco" aria-hidden>
          <div className="hk-home__binder-cover">
            <div className="hk-home__binder-spine" />
            <div className="hk-home__binder-title">
              <strong>HuggiMon</strong>
              <em>Trainer Cards</em>
            </div>
          </div>
        </div>

        <div className="hk-home__panel">
          <p className="hk-home__eyebrow">Hugging Face × Pokémon TCG</p>
          <h1 className="hk-home__title">Find your trainer card</h1>
          <p className="hk-home__sub">
            Enter your Hugging Face @username to open your holo card in the
            binder.
          </p>
          <div className="hk-home__search">
            <ProfileSearch large />
          </div>
        </div>
      </main>

      <footer className="hk-footer">
        Not affiliated with Pokémon or Hugging Face
      </footer>
    </div>
  );
}
