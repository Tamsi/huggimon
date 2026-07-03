"""HuggiMon Space entrypoint: Gradio Server + custom card routes."""

import os
import sys
from io import BytesIO
from pathlib import Path

import gradio as gr
from fastapi import Request
from fastapi.responses import HTMLResponse, Response
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))

from src.card_html import STYLE_THEMES, render_card_html
from src.card_renderer import render_png
from src.hf_fetcher import fetch_hf_profile
from src.scoring import build_card

# ---------------------------------------------------------------------------
# Build the card data / assets used by both UI and API routes
# ---------------------------------------------------------------------------

SPACE_OWNER = os.environ.get("SPACE_OWNER", "ImTamsi")
SPACE_NAME = os.environ.get("SPACE_NAME", "huggimon")


def _share_url(username: str, request: Request | None = None) -> str:
    if request is not None:
        host = request.headers.get("host", f"{SPACE_OWNER}-{SPACE_NAME}.hf.space")
        scheme = request.url.scheme
        return f"{scheme}://{host}/api/card/{username}.png"
    return f"https://{SPACE_OWNER}-{SPACE_NAME}.hf.space/api/card/{username}.png"


def _generate_card(username: str, style: str) -> tuple:
    username = username.strip().lstrip("@")
    if not username:
        raise gr.Error("Please enter a Hugging Face username.")

    try:
        profile = fetch_hf_profile(username)
    except ValueError as e:
        raise gr.Error(str(e)) from e

    card = build_card(profile)
    share = _share_url(username)
    html = render_card_html(card, style=style, share_url=share)

    png_bytes = render_png(card, style=style)
    img = Image.open(BytesIO(png_bytes))

    return html, img, share, f"```markdown\n[![HuggiMon]({share})](https://huggingface.co/spaces/{SPACE_OWNER}/{SPACE_NAME})\n```"


def _compare_cards(username_a: str, username_b: str, style: str) -> tuple:
    if not username_a or not username_b:
        raise gr.Error("Enter two usernames to compare.")
    html_a, img_a, share_a, _ = _generate_card(username_a, style)
    html_b, img_b, share_b, _ = _generate_card(username_b, style)
    return html_a, img_a, html_b, img_b, f"{share_a}\n{share_b}"


# ---------------------------------------------------------------------------
# Gradio UI
# ---------------------------------------------------------------------------

styles = list(STYLE_THEMES.keys())

card_css = """
.hcard { margin: 0 auto; }
.card-row { display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; }
"""

with gr.Blocks(title="HuggiMon") as _demo:
    gr.Markdown("# 🤗✨ HuggiMon")
    gr.Markdown("Generate your **AI Trainer Card** from your Hugging Face profile. Share it, download it, compare it.")

    with gr.Tab("Generate"):
        with gr.Row():
            username_input = gr.Textbox(
                label="Hugging Face username",
                placeholder="e.g. tamsi",
                scale=2,
            )
            style_input = gr.Dropdown(
                label="Card style",
                choices=styles,
                value="Starter",
                scale=1,
            )
        generate_btn = gr.Button("Generate card", variant="primary")

        with gr.Row():
            card_html = gr.HTML(label="Card preview")
        with gr.Row():
            card_image = gr.Image(label="Download PNG", type="pil", interactive=False, height=540)

        with gr.Row():
            share_url = gr.Textbox(label="Shareable image URL", interactive=False)
            readme_snippet = gr.Code(label="README embed snippet", language="markdown", interactive=False)

    with gr.Tab("Compare"):
        with gr.Row():
            compare_a = gr.Textbox(label="Trainer A", placeholder="e.g. tamsi")
            compare_b = gr.Textbox(label="Trainer B", placeholder="e.g. julien-c")
            compare_style = gr.Dropdown(label="Style", choices=styles, value="Starter")
        compare_btn = gr.Button("Compare", variant="primary")

        with gr.Row(elem_classes="card-row"):
            compare_html_a = gr.HTML()
            compare_html_b = gr.HTML()
        with gr.Row():
            compare_img_a = gr.Image(label="Trainer A", type="pil", interactive=False, height=540)
            compare_img_b = gr.Image(label="Trainer B", type="pil", interactive=False, height=540)
        compare_links = gr.Code(label="Share URLs", language="markdown", interactive=False)

    generate_btn.click(
        fn=_generate_card,
        inputs=[username_input, style_input],
        outputs=[card_html, card_image, share_url, readme_snippet],
    )
    compare_btn.click(
        fn=_compare_cards,
        inputs=[compare_a, compare_b, compare_style],
        outputs=[compare_html_a, compare_img_a, compare_html_b, compare_img_b, compare_links],
    )


# ---------------------------------------------------------------------------
# Gradio Server + custom card routes
# ---------------------------------------------------------------------------

app = gr.Server(title="HuggiMon")


@app.get("/api/card/{username}.png")
def api_card_png(username: str, style: str = "Starter"):
    style = style if style in STYLE_THEMES else "Starter"
    try:
        profile = fetch_hf_profile(username)
    except ValueError as e:
        return {"error": str(e)}, 404
    card = build_card(profile)
    png_bytes = render_png(card, style=style)
    return Response(content=png_bytes, media_type="image/png", headers={"Cache-Control": "public, max-age=300"})


@app.get("/api/card/{username}")
def api_card_json(username: str):
    try:
        profile = fetch_hf_profile(username)
    except ValueError as e:
        return {"error": str(e)}, 404
    card = build_card(profile)
    return {
        "username": card.username,
        "display_name": card.display_name,
        "level": card.level,
        "type": card.type,
        "rarity": card.rarity,
        "stats": {
            "model": card.stats.model,
            "data": card.stats.data,
            "space": card.stats.space,
            "impact": card.stats.impact,
            "community": card.stats.community,
            "docs": card.stats.docs,
        },
        "attacks": card.attacks,
        "passive": card.passive,
        "evolution": card.evolution,
        "totals": {
            "models": card.total_models,
            "datasets": card.total_datasets,
            "spaces": card.total_spaces,
            "followers": card.total_followers,
            "downloads": card.total_downloads,
            "likes": card.total_likes,
        },
    }


@app.get("/card/{username}")
def card_page(username: str, request: Request):
    share = _share_url(username, request=request)
    app_url = f"{request.url.scheme}://{request.headers.get('host', f'{SPACE_OWNER}-{SPACE_NAME}.hf.space')}"
    return HTMLResponse(f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta property="og:title" content="HuggiMon — {username} AI Trainer Card">
  <meta property="og:description" content="Check out {username}'s AI trainer card on HuggiMon!">
  <meta property="og:image" content="{share}">
  <meta name="twitter:card" content="summary_large_image">
  <title>HuggiMon — {username}</title>
  <style>
    body {{ font-family: system-ui, sans-serif; background: #0f172a; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }}
    img {{ max-width: 90vw; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); }}
    a.button {{ display: inline-block; margin-top: 24px; padding: 12px 24px; background: #6366f1; color: #fff; border-radius: 999px; text-decoration: none; font-weight: 700; }}
    .subtitle {{ margin-top: 12px; color: #94a3b8; }}
  </style>
</head>
<body>
  <img src="{share}" alt="{username} HuggiMon card" width="400">
  <div class="subtitle">{username}'s AI Trainer Card</div>
  <a class="button" href="{app_url}">Generate yours on HuggiMon</a>
</body>
</html>""")

gr.mount_gradio_app(app, _demo, path="/", theme=gr.themes.Soft(), css=card_css)

if __name__ == "__main__":
    app.launch()
