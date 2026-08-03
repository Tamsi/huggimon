import { Suspense } from "react";
import { Press_Start_2P } from "next/font/google";
import { BattleClient } from "./BattleClient";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-battle",
});

export const metadata = {
  title: "Trainer Battle · HuggiMon",
  description: "Watch two Hugging Face trainers duel with their HuggiMon cards.",
};

export default function BattlePage() {
  return (
    <main className={`battle-page ${pressStart.variable}`}>
      <Suspense fallback={<p className="battle-loading">Loading battle…</p>}>
        <BattleClient />
      </Suspense>
    </main>
  );
}
