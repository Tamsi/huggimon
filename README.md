---
title: HuggiMon
emoji: 🤗
colorFrom: purple
colorTo: pink
sdk: gradio
sdk_version: 6.19.0
app_file: app.py
short_description: Generate your AI trainer card from your Hugging Face profile
python_version: "3.12"
ssr_mode: false
---

# HuggiMon 🤗✨

Generate your **AI Trainer Card** from your Hugging Face profile. Turn your Hub activity into a collectible, shareable card inspired by AI/model culture.

## How it works

1. Enter your Hugging Face username.
2. HuggiMon fetches your public models, datasets, spaces, followers and activity.
3. It computes your stats, type, rarity, level, attacks and evolution path.
4. You get an animated Pokemon-TCG-style card — holographic shimmer, sparkles that scale with your rarity, and a 3D tilt effect on the profile page — plus a PNG to download and share.

## Follower Binder

Your followers fill your card binder: open the **Binder** tab, enter your username and browse your collection page by page. Each follower appears as a mini trainer card with its own level, stars and energies. Likes on your work become energies on your card — the more the community likes what you build, the more charged your card gets.

## Live demo

Visit the Space and try your username: https://huggingface.co/spaces/ImTamsi/huggimon

## Share your card

Your public profile lives at a short URL — just like GitFut:

```
https://imtamsi-huggimon.hf.space/ImTamsi
```

Open that link to see your animated trainer card (with the 3D tilt effect), energies, follower binder and share buttons. Legacy `/card/{username}` URLs redirect there automatically.

Add this snippet to your GitHub / Hugging Face README:

```markdown
[![HuggiMon](https://imtamsi-huggimon.hf.space/api/card/ImTamsi.png)](https://imtamsi-huggimon.hf.space/ImTamsi)
```

Or with custom width:

```markdown
<img src="https://imtamsi-huggimon.hf.space/api/card/ImTamsi.png" width="320" />
```

Replace `ImTamsi` with your username and update the Space URL if you fork it.

## Card stats

| Stat | Meaning |
|---|---|
| MODEL | Models published + likes + downloads |
| DATA | Datasets published |
| SPACE | Spaces published + likes |
| IMPACT | Total likes + downloads across your public work |
| COMMUNITY | Followers + discussions |
| DOCS | Documentation quality (model/dataset cards with descriptions) |

Each card also carries an **energy**: the energy type is derived from your card type, and the energy count from your total likes. Both are exposed in the card API under the `energy` field (`name`, `symbol`, `count`).

## Types & rarity

**Types:** `Code`, `Vision`, `Audio`, `NLP`, `Multimodal`, `Dataset`, `Agent`

**Rarity:** `Common`, `Rare`, `Epic`, `Legendary`

## PNG styles

These styles apply to the downloadable/shareable PNG image only — the animated card has a single Pokemon-TCG look:

- `Starter` — clean and accessible
- `Legendary` — gold, fire and impact
- `Dark Mode` — neon on black
- `Researcher` — lab, papers and datasets
- `Builder` — code, tools and spaces
- `Esport` — arena, speed, competition

## API endpoints

- `GET /{username}` — public trainer profile page (card + binder + share)
- `GET /api/card/{username}` — JSON card metadata (including the `energy` field)
- `GET /api/card/{username}.png` — PNG card image
- `GET /api/binder/{username}` — JSON binder page of follower mini-cards (optional `?page=` parameter)
- `/card/{username}` — redirects to `/{username}`

## Local development

Install the Space-managed dependencies locally for development:

```bash
python -m venv .venv
source .venv/bin/activate
pip install gradio huggingface_hub fastapi pillow python-multipart
python app.py
```

Open http://localhost:7860 and enter a Hugging Face username.

Run the test suite:

```bash
pip install -r requirements-dev.txt
python -m pytest tests/ -v
```

## License

MIT
