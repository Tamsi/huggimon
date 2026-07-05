import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { POKEMON_CARD_STYLES } from "@/lib/pokemon-card-styles";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HuggiMon — Hugging Face Trainer Cards",
  description:
    "Pokemon TCG-style trainer cards from Hugging Face profiles, with holographic effects by pokemon-cards-css.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={rubik.variable}>
      <head>
        {POKEMON_CARD_STYLES.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body className="hk-body antialiased">
        {children}
      </body>
    </html>
  );
}
