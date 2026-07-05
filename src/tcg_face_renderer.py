"""Render a Pokemon-TCG-proportioned card face (660×921) for pokemon-cards-css holo layers."""

from __future__ import annotations

import io
from typing import Tuple
from urllib.request import Request, urlopen

from PIL import Image, ImageDraw, ImageFont

from src.card_variant import variant_for_level
from src.energy import COLORLESS, ENERGY_BY_TYPE, EnergyInfo
from src.scoring import CardData
from src.tcg_card_layout import (
    CARD_SET_SIZE,
    RARITY_SYMBOLS,
    attack_rows,
    hp_value,
    retreat_cost,
    safe_rarity,
    stage_label,
    weakness_symbol,
)

# Official Pokemon TCG card scan proportions (matches pokemon-cards-css).
FACE_W = 660
FACE_H = 921

ENERGY_BY_NAME: dict[str, EnergyInfo] = {e.name: e for e in ENERGY_BY_TYPE.values()}
ENERGY_BY_NAME[COLORLESS.name] = COLORLESS

FRAME = (180, 188, 200)
INNER_TOP = (235, 220, 175)
INNER_BOTTOM = (210, 195, 150)
ART_BORDER = (196, 168, 75)
TEXT = (31, 41, 55)
HP_RED = (185, 28, 28)
INFO_GOLD = (233, 196, 106)


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    names = [
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _frame_colors(card: CardData) -> Tuple[Tuple[int, int, int], Tuple[int, int, int]]:
    """Outer frame tint — metallic silver/gold like real TCG cards."""
    variant = variant_for_level(card.level)
    if variant.gold_frame:
        return (245, 215, 120), (184, 134, 11)
    if variant.rainbow_frame:
        return (212, 218, 228), (148, 163, 184)
    if variant.css_class in ("hpk-v-v", "hpk-v-vmax", "hpk-v-vstar"):
        return (200, 206, 214), (140, 148, 158)
    r, g, b = ENERGY_BY_NAME.get(card.energy_name, COLORLESS).color
    return (r, g, b), tuple(min(255, int(c * 0.75)) for c in (r, g, b))


def _load_avatar(url: str, size: Tuple[int, int]) -> Image.Image | None:
    try:
        req = Request(url, headers={"User-Agent": "HuggiMon/1.0"})
        with urlopen(req, timeout=8) as resp:
            data = resp.read()
        img = Image.open(io.BytesIO(data)).convert("RGB")
        return img.resize(size, Image.Resampling.LANCZOS)
    except Exception:
        return None


def render_tcg_face_png(card: CardData) -> bytes:
    """Draw a TCG-layout card face sized for pokemon-cards-css clip paths."""
    img = Image.new("RGB", (FACE_W, FACE_H), FRAME)
    draw = ImageDraw.Draw(img)

    frame_c1, frame_c2 = _frame_colors(card)
    variant = variant_for_level(card.level)
    pad = 14
    inner = [pad, pad, FACE_W - pad, FACE_H - pad]
    draw.rounded_rectangle(inner, radius=18, fill=INNER_TOP, outline=frame_c1, width=6 if variant.holo else 4)

    # Inner gradient wash
    for y in range(pad, FACE_H - pad):
        t = (y - pad) / max(FACE_H - 2 * pad - 1, 1)
        color = tuple(int(INNER_TOP[i] + (INNER_BOTTOM[i] - INNER_TOP[i]) * t) for i in range(3))
        draw.line([(pad + 4, y), (FACE_W - pad - 4, y)], fill=color)

    stage = stage_label(card)
    hp = hp_value(card)
    rarity = safe_rarity(card)
    symbol = card.energy_symbol

    font_stage = _font(14, bold=True)
    font_name = _font(28, bold=True)
    font_hp = _font(32, bold=True)
    font_hp_lbl = _font(14, bold=True)
    font_info = _font(13, bold=True)
    font_sm = _font(12)
    font_attack = _font(15, bold=True)
    font_dmg = _font(22, bold=True)
    font_footer = _font(11, bold=True)
    font_flavor = _font(11)

    # Header row
    y0 = pad + 16
    draw.rounded_rectangle([pad + 16, y0, pad + 90, y0 + 22], radius=10, fill=(255, 255, 255, 200))
    draw.text((pad + 22, y0 + 2), stage.upper(), font=font_stage, fill=TEXT)

    name = card.display_name[:22]
    draw.text((pad + 100, y0 - 2), name, font=font_name, fill=TEXT)

    if variant.badge:
        badge = variant.badge
        bbox = font_sm.getbbox(badge)
        bw = (bbox[2] - bbox[0]) + 16 if bbox else 40
        bx = pad + 100 + font_name.getlength(name) + 8
        draw.rounded_rectangle([bx, y0 + 4, bx + bw, y0 + 24], radius=8, fill=frame_c2)
        draw.text((bx + 8, y0 + 5), badge, font=font_sm, fill=TEXT)

    hp_text = str(hp)
    draw.text((FACE_W - pad - 24, y0 + 2), "HP", font=font_hp_lbl, fill=HP_RED, anchor="rt")
    draw.text((FACE_W - pad - 24, y0 - 4), hp_text, font=font_hp, fill=HP_RED, anchor="rt")
    draw.text((FACE_W - pad - 52, y0 + 8), symbol, font=font_name, fill=TEXT, anchor="rt")

    # Art window — aligned with pokemon-cards-css trainer clip (~14.5% top, 8.5% sides)
    art_x1 = int(FACE_W * 0.085)
    art_y1 = int(FACE_H * 0.145)
    art_x2 = int(FACE_W * 0.915)
    art_y2 = int(FACE_H * 0.518)
    draw.rectangle([art_x1 - 5, art_y1 - 5, art_x2 + 5, art_y2 + 5], fill=ART_BORDER)
    # Rich art backdrop so holo layers have contrast (like real card illustrations)
    er, eg, eb = ENERGY_BY_NAME.get(card.energy_name, COLORLESS).color
    for y in range(art_y1, art_y2):
        t = (y - art_y1) / max(art_y2 - art_y1 - 1, 1)
        row = (
            int(er * (0.35 + 0.25 * t) + 40),
            int(eg * (0.35 + 0.25 * t) + 40),
            int(eb * (0.35 + 0.25 * t) + 50),
        )
        draw.line([(art_x1, y), (art_x2, y)], fill=row)

    art_w, art_h = art_x2 - art_x1, art_y2 - art_y1
    if card.avatar_url:
        avatar = _load_avatar(card.avatar_url, (art_w, art_h))
        if avatar:
            img.paste(avatar, (art_x1, art_y1))
        else:
            initial = (card.username[:1] or "?").upper()
            draw.text(
                (art_x1 + art_w // 2, art_y1 + art_h // 2),
                initial,
                font=_font(72, bold=True),
                fill=(100, 116, 139),
                anchor="mm",
            )
    else:
        initial = (card.username[:1] or "?").upper()
        draw.text(
            (art_x1 + art_w // 2, art_y1 + art_h // 2),
            initial,
            font=_font(72, bold=True),
            fill=(100, 116, 139),
            anchor="mm",
        )

    # Info bar
    info_y = art_y2 + 10
    info_h = 26
    draw.rounded_rectangle(
        [art_x1, info_y, art_x2, info_y + info_h], radius=4, fill=INFO_GOLD
    )
    info = (
        f"LV {card.level} · {card.type} Trainer · "
        f"{card.total_models} models · {card.total_followers} followers"
    )
    draw.text((FACE_W // 2, info_y + 5), info, font=font_info, fill=TEXT, anchor="mt")

    # Ability
    ab_y = info_y + info_h + 12
    draw.rounded_rectangle([art_x1, ab_y, art_x1 + 58, ab_y + 18], radius=8, fill=HP_RED)
    draw.text((art_x1 + 6, ab_y + 1), "Ability", font=_font(10, bold=True), fill=(255, 255, 255))
    draw.text((art_x1 + 66, ab_y), card.passive[:40], font=font_sm, fill=TEXT)
    draw.text(
        (art_x1, ab_y + 22),
        f"Draws power from {card.total_likes} likes and {card.total_downloads} downloads.",
        font=_font(10),
        fill=(55, 65, 81),
    )

    # Attacks
    atk_y = ab_y + 52
    for name_atk, damage, cost in attack_rows(card):
        draw.line([(art_x1, atk_y), (art_x2, atk_y)], fill=(31, 41, 55), width=1)
        cx = art_x1 + 8
        for _ in range(cost):
            draw.ellipse([cx, atk_y + 8, cx + 16, atk_y + 24], fill=frame_c1, outline=TEXT)
            draw.text((cx + 4, atk_y + 6), symbol, font=_font(9), fill=TEXT)
            cx += 20
        draw.text((art_x1 + 90, atk_y + 6), name_atk[:28], font=font_attack, fill=TEXT)
        draw.text((art_x2 - 8, atk_y + 4), str(damage), font=font_dmg, fill=TEXT, anchor="rt")
        atk_y += 34

    # Footer
    foot_y = FACE_H - pad - 72
    draw.line([(art_x1, foot_y), (art_x2, foot_y)], fill=TEXT, width=2)
    weak = weakness_symbol(card)
    retreat = "●" * retreat_cost(card)
    set_sym = RARITY_SYMBOLS[rarity]
    draw.text((art_x1, foot_y + 8), "weakness", font=_font(8), fill=(75, 85, 99))
    draw.text((art_x1, foot_y + 18), f"{weak}×2", font=font_footer, fill=TEXT)
    draw.text((FACE_W // 2, foot_y + 8), "retreat", font=_font(8), fill=(75, 85, 99), anchor="mt")
    draw.text((FACE_W // 2, foot_y + 18), retreat, font=font_footer, fill=TEXT, anchor="mt")
    draw.text((art_x2, foot_y + 8), "set", font=_font(8), fill=(75, 85, 99), anchor="rt")
    draw.text(
        (art_x2, foot_y + 18),
        f"{set_sym} {card.level}/{CARD_SET_SIZE}",
        font=font_footer,
        fill=TEXT,
        anchor="rt",
    )
    draw.text((art_x1, foot_y + 40), card.evolution[:60], font=font_flavor, fill=(75, 85, 99))
    draw.text((art_x2, FACE_H - pad - 12), "huggimon.space", font=_font(9), fill=(100, 116, 139), anchor="rb")

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()
