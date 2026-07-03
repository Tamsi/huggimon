"""Render a HuggiMon card as a PNG using Pillow."""

from io import BytesIO
from typing import Dict, Tuple

from PIL import Image, ImageDraw, ImageFont

from src.scoring import CardData


CARD_WIDTH = 760
CARD_HEIGHT = 1080
PADDING = 44

PALETTES: Dict[str, Dict[str, Tuple]] = {
    "Starter": {
        "bg_top": (245, 247, 250),
        "bg_bottom": (195, 207, 226),
        "accent": (99, 102, 241),
        "accent2": (129, 140, 248),
        "text": (31, 41, 55),
        "subtext": (75, 85, 99),
        "card": (255, 255, 255),
        "bar_bg": (229, 231, 235),
    },
    "Legendary": {
        "bg_top": (255, 241, 193),
        "bg_bottom": (255, 138, 0),
        "accent": (180, 83, 9),
        "accent2": (245, 158, 11),
        "text": (69, 26, 3),
        "subtext": (120, 53, 15),
        "card": (255, 251, 235),
        "bar_bg": (254, 243, 199),
    },
    "Dark Mode": {
        "bg_top": (15, 23, 42),
        "bg_bottom": (76, 29, 149),
        "accent": (34, 211, 238),
        "accent2": (168, 85, 247),
        "text": (248, 250, 252),
        "subtext": (203, 213, 225),
        "card": (30, 41, 59),
        "bar_bg": (51, 65, 85),
    },
    "Researcher": {
        "bg_top": (224, 242, 254),
        "bg_bottom": (14, 165, 233),
        "accent": (3, 105, 161),
        "accent2": (56, 189, 248),
        "text": (8, 47, 73),
        "subtext": (12, 74, 110),
        "card": (240, 249, 255),
        "bar_bg": (224, 242, 254),
    },
    "Builder": {
        "bg_top": (255, 237, 213),
        "bg_bottom": (249, 115, 22),
        "accent": (194, 65, 12),
        "accent2": (251, 146, 60),
        "text": (67, 20, 7),
        "subtext": (124, 45, 18),
        "card": (255, 247, 237),
        "bar_bg": (255, 237, 213),
    },
    "Esport": {
        "bg_top": (26, 5, 5),
        "bg_bottom": (220, 38, 38),
        "accent": (250, 204, 21),
        "accent2": (239, 68, 68),
        "text": (254, 242, 242),
        "subtext": (254, 202, 202),
        "card": (69, 10, 10),
        "bar_bg": (127, 29, 29),
    },
}


def _gradient(width: int, height: int, top: Tuple, bottom: Tuple) -> Image.Image:
    img = Image.new("RGB", (width, height), top)
    for y in range(height):
        ratio = y / max(height - 1, 1)
        r = int(top[0] + (bottom[0] - top[0]) * ratio)
        g = int(top[1] + (bottom[1] - top[1]) * ratio)
        b = int(top[2] + (bottom[2] - top[2]) * ratio)
        draw = ImageDraw.Draw(img)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    return img


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
        "Arial Bold.ttf" if bold else "Arial.ttf",
        "Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for c in candidates:
        try:
            return ImageFont.truetype(c, size)
        except Exception:
            continue
    return ImageFont.load_default()


def _rounded_rect(draw: ImageDraw.Draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def _draw_text(draw, text, pos, font, fill, anchor="lt"):
    draw.text(pos, text, font=font, fill=fill, anchor=anchor)


def _draw_star(draw, cx, cy, r, fill):
    """Draw a 5-pointed star centered at (cx, cy) with outer radius r."""
    import math

    points = []
    for i in range(10):
        angle = math.pi / 2 + i * 2 * math.pi / 10
        radius = r if i % 2 == 0 else r / 2.5
        points.append((cx + radius * math.cos(angle), cy - radius * math.sin(angle)))
    draw.polygon(points, fill=fill)


def _draw_wrapped_text(draw, text, x, y, max_width, font, fill):
    """Draw text, wrapping to a second line if it exceeds max_width."""
    bbox = font.getbbox(text)
    if bbox and (bbox[2] - bbox[0]) <= max_width:
        draw.text((x, y), text, font=font, fill=fill)
        return y

    # Split into two lines at the middle separator if present
    if " · " in text:
        parts = text.split(" · ")
        if len(parts) == 2:
            draw.text((x, y), parts[0], font=font, fill=fill)
            bbox2 = font.getbbox(parts[1])
            line_h = (bbox2[3] - bbox2[1]) if bbox2 else font.size
            draw.text((x, y + line_h + 4), parts[1], font=font, fill=fill)
            return y

    draw.text((x, y), text, font=font, fill=fill)
    return y


def _draw_stat_bar(draw, x, y, width, label, value, palette, font_label, font_value):
    label_text = f"{label}"
    value_text = f"{value}"
    _draw_text(draw, label_text, (x, y), font_label, palette["text"])
    bbox = font_value.getbbox(value_text)
    value_w = bbox[2] - bbox[0] if bbox else 40
    _draw_text(draw, value_text, (x + width - value_w, y), font_label, palette["text"])

    bar_y = y + 28
    bar_h = 16
    _rounded_rect(draw, [x, bar_y, x + width, bar_y + bar_h], bar_h // 2, palette["bar_bg"])
    fill_width = int(width * (value / 100.0))
    if fill_width > 0:
        _rounded_rect(draw, [x, bar_y, x + fill_width, bar_y + bar_h], bar_h // 2, palette["accent"])


def render_png(card: CardData, style: str = "Starter") -> bytes:
    palette = PALETTES.get(style, PALETTES["Starter"])
    img = _gradient(CARD_WIDTH, CARD_HEIGHT, palette["bg_top"], palette["bg_bottom"])
    draw = ImageDraw.Draw(img)

    # Top accent bar
    draw.rectangle([0, 0, CARD_WIDTH, 12], fill=palette["accent"])

    # Header
    font_tag = _font(20, bold=True)
    font_name = _font(56, bold=True)
    font_rarity = _font(44)
    font_rarity_label = _font(20, bold=True)

    _draw_text(draw, "AI TRAINER CARD", (PADDING, 36), font_tag, palette["accent"])
    _draw_text(draw, card.display_name[:18].upper(), (PADDING, 66), font_name, palette["text"])

    star_count = {"Common": 1, "Rare": 2, "Epic": 3, "Legendary": 4}.get(card.rarity, 1)
    star_spacing = 34
    start_x = CARD_WIDTH - PADDING - (star_count * star_spacing) + star_spacing // 2
    for i in range(star_count):
        _draw_star(draw, start_x + i * star_spacing, 80, 16, palette["accent"])
    _draw_text(draw, card.rarity.upper(), (CARD_WIDTH - PADDING, 120), font_rarity_label, palette["subtext"], anchor="ra")

    # Type / Level boxes
    box_y = 160
    box_h = 110
    box_w = (CARD_WIDTH - PADDING * 2 - 24) // 2
    _rounded_rect(draw, [PADDING, box_y, PADDING + box_w, box_y + box_h], 24, palette["card"])
    _rounded_rect(draw, [PADDING + box_w + 24, box_y, CARD_WIDTH - PADDING, box_y + box_h], 24, palette["card"])

    font_box_label = _font(18, bold=True)
    font_type = _font(34, bold=True)
    font_level = _font(56, bold=True)

    _draw_text(draw, "TYPE", (PADDING + box_w // 2, box_y + 18), font_box_label, palette["accent"], anchor="mt")
    _draw_text(draw, card.type.upper(), (PADDING + box_w // 2, box_y + 60), font_type, palette["text"], anchor="mt")

    _draw_text(draw, "LEVEL", (PADDING + box_w + 24 + box_w // 2, box_y + 18), font_box_label, palette["accent"], anchor="mt")
    _draw_text(draw, str(card.level), (PADDING + box_w + 24 + box_w // 2, box_y + 60), font_level, palette["accent"], anchor="mt")

    # Stats panel
    stats_y = 300
    stats_h = 460
    _rounded_rect(draw, [PADDING, stats_y, CARD_WIDTH - PADDING, stats_y + stats_h], 28, palette["card"])

    stats = [
        ("MODEL", card.stats.model),
        ("DATA", card.stats.data),
        ("SPACE", card.stats.space),
        ("IMPACT", card.stats.impact),
        ("COMMUNITY", card.stats.community),
        ("DOCS", card.stats.docs),
    ]
    font_stat_label = _font(24, bold=True)
    font_stat_value = _font(24, bold=True)
    bar_w = CARD_WIDTH - PADDING * 2 - 48
    for i, (label, value) in enumerate(stats):
        y = stats_y + 28 + i * 72
        _draw_stat_bar(draw, PADDING + 24, y, bar_w, label, value, palette, font_stat_label, font_stat_value)

    # Attacks / Passive
    bottom_y = stats_y + stats_h + 24
    bottom_h = 130
    _rounded_rect(draw, [PADDING, bottom_y, (CARD_WIDTH // 2) - 12, bottom_y + bottom_h], 22, palette["card"])
    _rounded_rect(draw, [(CARD_WIDTH // 2) + 12, bottom_y, CARD_WIDTH - PADDING, bottom_y + bottom_h], 22, palette["card"])

    font_section_label = _font(18, bold=True)
    font_section_value = _font(22, bold=True)
    attacks_text = " · ".join(card.attacks) if card.attacks else "Learning"
    box_inner_w = (CARD_WIDTH // 2) - PADDING - 36
    _draw_text(draw, "ATTACKS", (PADDING + 18, bottom_y + 14), font_section_label, palette["accent"])
    _draw_wrapped_text(draw, attacks_text, PADDING + 18, bottom_y + 48, box_inner_w, font_section_value, palette["text"])

    _draw_text(draw, "PASSIVE", ((CARD_WIDTH // 2) + 30, bottom_y + 14), font_section_label, palette["accent"])
    _draw_wrapped_text(draw, card.passive, (CARD_WIDTH // 2) + 30, bottom_y + 52, box_inner_w, font_section_value, palette["text"])

    # Evolution
    evo_y = bottom_y + bottom_h + 18
    evo_h = 60
    _rounded_rect(draw, [PADDING, evo_y, CARD_WIDTH - PADDING, evo_y + evo_h], 18, palette["card"])
    _draw_text(draw, "EVOLUTION", (PADDING + 18, evo_y + 10), font_section_label, palette["accent"])
    evolution_text = card.evolution.replace("→", "->")
    _draw_text(draw, evolution_text, (PADDING + 18, evo_y + 36), font_section_value, palette["text"])

    # Footer metrics
    footer_y = evo_y + evo_h + 22
    font_footer = _font(20)
    footer_text = f"{card.total_models} models · {card.total_datasets} datasets · {card.total_spaces} spaces"
    footer_text2 = f"{card.total_likes} likes · {card.total_downloads} downloads"
    _draw_text(draw, footer_text, (PADDING, footer_y), font_footer, palette["subtext"])
    bbox2 = font_footer.getbbox(footer_text2)
    text2_w = bbox2[2] - bbox2[0] if bbox2 else 0
    _draw_text(draw, footer_text2, (CARD_WIDTH - PADDING - text2_w, footer_y), font_footer, palette["subtext"])

    # Subtle watermark
    font_watermark = _font(18)
    _draw_text(draw, "huggimon.space", (CARD_WIDTH // 2, CARD_HEIGHT - 24), font_watermark, palette["subtext"], anchor="mm")

    buffer = BytesIO()
    img.save(buffer, format="PNG", optimize=True)
    return buffer.getvalue()
