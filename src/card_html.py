"""Generate the HTML/CSS card preview for the Gradio UI."""

from src.scoring import CardData


STYLE_THEMES = {
    "Starter": {
        "bg": "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        "accent": "#6366f1",
        "accent2": "#818cf8",
        "text": "#1f2937",
        "subtext": "#4b5563",
        "card": "#ffffff",
        "shine": "rgba(255,255,255,0.6)",
    },
    "Legendary": {
        "bg": "linear-gradient(135deg, #fff1c1 0%, #ff8a00 100%)",
        "accent": "#b45309",
        "accent2": "#f59e0b",
        "text": "#451a03",
        "subtext": "#78350f",
        "card": "#fffbeb",
        "shine": "rgba(255,255,255,0.7)",
    },
    "Dark Mode": {
        "bg": "linear-gradient(135deg, #0f172a 0%, #4c1d95 100%)",
        "accent": "#22d3ee",
        "accent2": "#a855f7",
        "text": "#f8fafc",
        "subtext": "#cbd5e1",
        "card": "#1e293b",
        "shine": "rgba(255,255,255,0.15)",
    },
    "Researcher": {
        "bg": "linear-gradient(135deg, #e0f2fe 0%, #0ea5e9 100%)",
        "accent": "#0369a1",
        "accent2": "#38bdf8",
        "text": "#082f49",
        "subtext": "#0c4a6e",
        "card": "#f0f9ff",
        "shine": "rgba(255,255,255,0.6)",
    },
    "Builder": {
        "bg": "linear-gradient(135deg, #ffedd5 0%, #f97316 100%)",
        "accent": "#c2410c",
        "accent2": "#fb923c",
        "text": "#431407",
        "subtext": "#7c2d12",
        "card": "#fff7ed",
        "shine": "rgba(255,255,255,0.6)",
    },
    "Esport": {
        "bg": "linear-gradient(135deg, #1a0505 0%, #dc2626 100%)",
        "accent": "#facc15",
        "accent2": "#ef4444",
        "text": "#fef2f2",
        "subtext": "#fecaca",
        "card": "#450a0a",
        "shine": "rgba(255,255,255,0.2)",
    },
}


RARITY_GLYPHS = {
    "Common": "★",
    "Rare": "★★",
    "Epic": "★★★",
    "Legendary": "★★★★",
}


def _stat_bar(label: str, value: int, theme: dict) -> str:
    return f"""
    <div class="hstat" style="margin: 6px 0;">
      <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:{theme['text']};">
        <span>{label}</span><span>{value}</span>
      </div>
      <div style="background:{theme['shine']};border-radius:999px;height:8px;overflow:hidden;margin-top:3px;">
        <div style="width:{value}%;background:{theme['accent']};height:100%;border-radius:999px;transition:width 0.8s ease;"></div>
      </div>
    </div>
    """


def _energy_row(card: CardData, theme: dict) -> str:
    label = f"Energy · {card.energy_name}"
    if card.energy_count <= 0:
        badges = f'<span style="font-size:12px;font-weight:700;color:{theme["subtext"]};">No energy yet</span>'
    else:
        badge = (
            f'<span style="display:inline-flex;align-items:center;justify-content:center;'
            f'width:22px;height:22px;border-radius:50%;font-size:12px;'
            f'background:{theme["card"]};border:2px solid {theme["accent"]};">{card.energy_symbol}</span>'
        )
        badges = badge * card.energy_count
    return f"""
    <div style="margin-bottom:14px;">
      <div style="font-size:10px;font-weight:700;color:{theme['accent']};text-transform:uppercase;letter-spacing:1px;">{label}</div>
      <div style="display:flex;gap:6px;margin-top:6px;align-items:center;">{badges}</div>
    </div>
    """


def render_card_html(card: CardData, style: str = "Starter", share_url: str = "") -> str:
    theme = STYLE_THEMES.get(style, STYLE_THEMES["Starter"])
    rarity_glyph = RARITY_GLYPHS.get(card.rarity, "★")
    attacks = " · ".join(card.attacks) if card.attacks else "Learning"

    stats_html = "".join(
        [
            _stat_bar("MODEL", card.stats.model, theme),
            _stat_bar("DATA", card.stats.data, theme),
            _stat_bar("SPACE", card.stats.space, theme),
            _stat_bar("IMPACT", card.stats.impact, theme),
            _stat_bar("COMMUNITY", card.stats.community, theme),
            _stat_bar("DOCS", card.stats.docs, theme),
        ]
    )

    share_hint = f"""
    <div style="margin-top:14px;font-size:11px;color:{theme['subtext']};text-align:center;">
      Share: <code style="background:{theme['shine']};padding:2px 6px;border-radius:4px;">{share_url or f'/api/card/{card.username}.png'}</code>
    </div>
    """

    return f"""
    <div class="hcard" style="
      width:380px;
      border-radius:20px;
      padding:22px;
      background:{theme['bg']};
      color:{theme['text']};
      font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
      box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);
      border:1px solid {theme['shine']};
      position:relative;
      overflow:hidden;
    ">
      <div style="position:absolute;top:0;left:0;right:0;height:6px;background:{theme['accent']};"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <div>
          <div style="font-size:11px;letter-spacing:1.5px;font-weight:800;color:{theme['accent']};text-transform:uppercase;">AI Trainer Card</div>
          <h2 style="margin:4px 0 0;font-size:28px;letter-spacing:-0.5px;">{card.display_name}</h2>
        </div>
        <div style="text-align:right;">
          <div style="font-size:22px;color:{theme['accent']};">{rarity_glyph}</div>
          <div style="font-size:11px;font-weight:700;color:{theme['subtext']};">{card.rarity}</div>
        </div>
      </div>

      <div style="display:flex;gap:12px;margin-bottom:14px;">
        <div style="flex:1;background:{theme['card']};border-radius:14px;padding:12px;text-align:center;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="font-size:10px;font-weight:700;color:{theme['accent']};text-transform:uppercase;">Type</div>
          <div style="font-size:16px;font-weight:800;">{card.type}</div>
        </div>
        <div style="flex:1;background:{theme['card']};border-radius:14px;padding:12px;text-align:center;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="font-size:10px;font-weight:700;color:{theme['accent']};text-transform:uppercase;">Level</div>
          <div style="font-size:22px;font-weight:900;color:{theme['accent']};">{card.level}</div>
        </div>
      </div>

      {_energy_row(card, theme)}

      <div style="background:{theme['card']};border-radius:16px;padding:16px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
        {stats_html}
      </div>

      <div style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="background:{theme['card']};border-radius:12px;padding:10px;">
          <div style="font-size:9px;font-weight:700;color:{theme['accent']};text-transform:uppercase;">Attacks</div>
          <div style="font-size:12px;font-weight:700;">{attacks}</div>
        </div>
        <div style="background:{theme['card']};border-radius:12px;padding:10px;">
          <div style="font-size:9px;font-weight:700;color:{theme['accent']};text-transform:uppercase;">Passive</div>
          <div style="font-size:12px;font-weight:700;">{card.passive}</div>
        </div>
      </div>

      <div style="margin-top:12px;background:{theme['card']};border-radius:12px;padding:10px;text-align:center;">
        <div style="font-size:9px;font-weight:700;color:{theme['accent']};text-transform:uppercase;">Evolution</div>
        <div style="font-size:12px;font-weight:700;">{card.evolution}</div>
      </div>

      <div style="margin-top:14px;display:flex;justify-content:space-between;font-size:10px;color:{theme['subtext']};">
        <span>🤗 {card.total_models} models · {card.total_datasets} datasets · {card.total_spaces} spaces</span>
        <span>❤️ {card.total_likes} · ⬇️ {card.total_downloads}</span>
      </div>

      {share_hint}
    </div>
    """
