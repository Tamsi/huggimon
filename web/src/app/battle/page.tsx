import { Suspense } from "react";
import { BattleClient } from "./BattleClient";

export const metadata = {
  title: "Trainer Battle · HuggiMon",
  description: "Watch two Hugging Face trainers duel with their HuggiMon cards.",
};

export default function BattlePage() {
  return (
    <main className="battle-page">
      <Suspense fallback={<p>Loading battle…</p>}>
        <BattleClient />
      </Suspense>
    </main>
  );
}
