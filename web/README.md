# HuggiMon Web (Next.js)

Pokemon TCG-style trainer cards from Hugging Face profiles, deployed on [Vercel](https://vercel.com).

Built on [pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css) (holo stack) and inspired by [gitfut](https://github.com/younesfdj/gitfut) (profile-as-collectible-card). See the [root README](../README.md) for credits and demo GIF.

## Develop

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000 — try `/lysandre`, `/lhoestq`, `/ImTamsi`.

## Deploy on Vercel

1. Import the repo and set **Root Directory** to `web`.
2. Deploy — no env vars required (public HF API).

## Face composition

Each card face is **660×921** (TCG scan size):

1. **Avatar layer** — HF profile photo, `cover` cropped
2. **Template overlay** — pre-made SVG frame per tier (`face-overlay.ts`)

| Template | Levels | Layout |
|----------|--------|--------|
| `trainer` | Common → Radiant | Avatar in art window + trainer frame |
| `pokemon-v` | 52+ | Full-bleed avatar + V overlay |
| `full-art` | 59+ | Full-bleed + ultra rare text style |
| `vmax` / `rainbow` | 73+ / 80+ | Full-bleed + VMAX chrome |
| `vstar` / `secret` | 87+ / 94+ | Full-bleed + tier accents |

Full-bleed tiers use class `hpk-full-bleed` so pokemon-cards-css holo runs **without clip-path** — same as [poke-holo.simey.me](https://poke-holo.simey.me/) alt-art cards.

## Architecture

| Path | Role |
|------|------|
| `src/components/PokemonCard.tsx` | Interactive holo card (upstream markup + springs) |
| `src/lib/card-variant.ts` | 14 holo tiers from HF level |
| `src/lib/scoring.ts` | Stats, level, attacks from HF repos |
| `src/lib/hf-fetcher.ts` | Hugging Face REST API |
| `public/pokemon-cards-css/` | Vendored CSS + assets from pokemon-cards-css |
| `public/pokemon-cards-css/css/huggimon.css` | Trainer-face clip-path overrides only |

## Why trainer faces differ from demo site

[poke-holo.simey.me](https://poke-holo.simey.me/) uses official 660×921 card scans. HuggiMon composes faces from **user avatars + tier templates**; tiers 59+ use full-bleed layout so rainbow/VMAX/VStar holo shaders match upstream behaviour.
