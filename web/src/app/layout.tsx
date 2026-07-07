import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { AmbientBackdrop } from "@/components/AmbientBackdrop";
import { SiteHeader } from "@/components/SiteHeader";
import { POKEMON_CARD_STYLES } from "@/lib/pokemon-card-styles";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://huggimon.co",
  ),
  title: "HuggiMon — Hugging Face Trainer Cards",
  description:
    "Pokemon TCG-style trainer cards from Hugging Face profiles, with holographic effects by pokemon-cards-css.",
  icons: {
    icon: [{ url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: "/brand/apple-touch-icon.png",
  },
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
        <AmbientBackdrop fixed />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
