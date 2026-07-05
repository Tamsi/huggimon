"""Generate the HTML binder page (3x3 follower mini-cards) for the Gradio UI."""

import html

from src.binder_fetcher import BinderPage, FollowerMini
from src.card_variant import Variant, variant_for_level

BINDER_THEME = {
    "bg": "#1c1917",
    "pocket": "#292524",
    "border": "#44403c",
    "text": "#fafaf9",
    "subtext": "#a8a29e",
    "accent": "#fbbf24",
}

POCKETS_PER_PAGE = 9

EMPTY_SLEEVE_CLASS = "binder-empty-sleeve"

# Base styling for the mini pokecards; every selector is hpkm-prefixed so the
# fragment stays scoped when injected next to the main card CSS.
_MINI_BASE_CSS = """
.hpkm-card{position:relative;width:100%;aspect-ratio:63/88;border-radius:10px;
  padding:4px;box-sizing:border-box;overflow:hidden;color:#1f2937;min-width:0;
  font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
.hpkm-card.hpk-v-common{background:#cbd5e1;}
.hpkm-card.hpk-v-reverse,.hpkm-card.hpk-v-holo,.hpkm-card.hpk-v-cosmos,
.hpkm-card.hpk-v-amazing,.hpkm-card.hpk-v-radiant,.hpkm-card.hpk-v-tg{background:#cbd5e1;}
.hpkm-card.hpk-v-v,.hpkm-card.hpk-v-vfa,.hpkm-card.hpk-v-vaa,.hpkm-card.hpk-v-vmax,
.hpkm-card.hpk-v-vstar{background:linear-gradient(135deg,#dfe3e8,#8e959e,#c8ccd4);}
.hpkm-card.hpk-v-vmax-r{background:linear-gradient(90deg,#ff004d,#ff7a00,#ffe600,#00e05a,#00b3ff,#8a2be2,#ff004d);
  background-size:400% 100%;animation:hpkm-rainbow 8s linear infinite;}
.hpkm-card.hpk-v-gold{background:linear-gradient(120deg,#f5d76e,#b8860b,#ffe9a0,#b8860b,#f5d76e);
  background-size:300% 100%;animation:hpkm-goldshift 10s linear infinite;}
@keyframes hpkm-rainbow{0%{background-position:0% 50%;}100%{background-position:400% 50%;}}
@keyframes hpkm-goldshift{0%{background-position:0% 50%;}100%{background-position:300% 50%;}}
.hpkm-inner{position:relative;width:100%;height:100%;border-radius:7px;overflow:hidden;
  background:linear-gradient(180deg,#f8fafc,#e2e8f0);
  display:flex;flex-direction:column;gap:3px;padding:6px;box-sizing:border-box;}
.hpkm-name-row{display:flex;align-items:center;gap:4px;min-width:0;}
.hpkm-name{flex:1;font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hpkm-badge{font-size:8px;font-style:italic;font-weight:800;padding:0 5px;border-radius:999px;
  white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,0.3);}
.hpk-v-v .hpkm-badge,.hpk-v-vmax .hpkm-badge,.hpk-v-vstar .hpkm-badge{background:linear-gradient(180deg,#f4f5f7,#c7ccd4);color:#1f2937;}
.hpk-v-vmax-r .hpkm-badge{background:linear-gradient(90deg,#ff004d,#ff7a00,#ffe600,#00e05a,#00b3ff,#8a2be2);color:#fff;}
.hpk-v-gold .hpkm-badge{background:linear-gradient(180deg,#ffe9a0,#d4af37);color:#5b3a00;}
.hpkm-meta{display:flex;justify-content:space-between;align-items:center;gap:4px;font-size:10px;}
.hpkm-level{font-weight:800;}
.hpkm-stars{color:#d4a017;letter-spacing:1px;}
.hpkm-art{height:45%;flex:none;border:2px solid rgba(31,41,55,0.25);border-radius:3px;overflow:hidden;
  background:linear-gradient(160deg,#e2e8f0,#94a3b8);
  display:flex;align-items:center;justify-content:center;}
.hpkm-avatar{width:100%;height:100%;object-fit:cover;display:block;}
.hpkm-initial{font-size:26px;font-weight:900;color:rgba(31,41,55,0.5);text-transform:uppercase;}
.hpkm-footer{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:4px;min-width:0;}
.hpkm-energy{font-size:9px;letter-spacing:1px;color:#b45309;flex:none;}
.hpkm-energy-none{color:#94a3b8;}
.hpkm-user{font-size:8px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hpkm-layer{position:absolute;inset:4px;border-radius:7px;pointer-events:none;}
@media (prefers-reduced-motion: reduce){
  .hpkm-card,.hpkm-layer{animation:none !important;}
}
"""

_MINI_HOLO_CSS = """
.hpkm-holo{opacity:0.18;
  background:linear-gradient(60deg,#ff004d,#ff7a00,#ffe600,#00e05a,#00b3ff,#8a2be2,#ff004d);
  background-size:300% 300%;mix-blend-mode:color-dodge;animation:hpkm-holo-shift 6s linear infinite;}
@keyframes hpkm-holo-shift{0%{background-position:0% 0%;}50%{background-position:100% 100%;}100%{background-position:0% 0%;}}
"""

_MINI_SPARKLE_CSS = """
.hpkm-sparkles{background-image:
    radial-gradient(circle 1.5px at 22px 34px,#fff 92%,transparent),
    radial-gradient(circle 2px at 68px 12px,#fff 92%,transparent),
    radial-gradient(circle 1px at 44px 76px,#fffbe6 92%,transparent);
  background-size:90px 90px,130px 130px,70px 70px;
  animation:hpkm-sparkle 3.2s ease-in-out infinite;}
@keyframes hpkm-sparkle{0%,100%{opacity:0.15;}50%{opacity:0.6;}}
"""


def _avatar_html(card: FollowerMini) -> str:
    if card.avatar_url:
        return (
            f'<img class="hpkm-avatar" '
            f'src="{html.escape(card.avatar_url, quote=True)}" alt=""/>'
        )
    initial = html.escape(card.username[:1].upper() or "?")
    return f'<div class="hpkm-initial">{initial}</div>'


def _filled_pocket(card: FollowerMini, variant: Variant) -> str:
    display_name = html.escape(card.display_name)
    username = html.escape(card.username)
    stars = "★" * card.stars

    if card.energy_count > 0:
        energy_html = f'<span class="hpkm-energy">{"✦" * card.energy_count}</span>'
    else:
        energy_html = '<span class="hpkm-energy hpkm-energy-none">–</span>'

    badge_html = ""
    if variant.badge:
        badge_html = f'<span class="hpkm-badge">{html.escape(variant.badge)}</span>'

    overlays = ""
    if variant.holo:
        overlays += '<div class="hpkm-layer hpkm-holo"></div>'
    if variant.sparkles:
        overlays += '<div class="hpkm-layer hpkm-sparkles"></div>'

    return f"""
    <div class="hpkm-card {variant.css_class}">
      <div class="hpkm-inner">
        <div class="hpkm-name-row">
          <span class="hpkm-name">{display_name}</span>{badge_html}
        </div>
        <div class="hpkm-meta">
          <span class="hpkm-level">LV {card.level}</span>
          <span class="hpkm-stars">{stars}</span>
        </div>
        <div class="hpkm-art">{_avatar_html(card)}</div>
        <div class="hpkm-footer">
          {energy_html}
          <span class="hpkm-user">@{username}</span>
        </div>
      </div>
      {overlays}
    </div>
    """


def _empty_sleeve() -> str:
    return f"""
    <div class="{EMPTY_SLEEVE_CLASS}" style="
      border:2px dashed {BINDER_THEME['border']};
      border-radius:12px;
      padding:10px;
      min-height:130px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:11px;
      color:{BINDER_THEME['subtext']};
      opacity:0.6;
    ">empty</div>
    """


def render_binder_html(binder: BinderPage) -> str:
    owner = html.escape(binder.owner)
    cards = binder.cards[:POCKETS_PER_PAGE]
    variants = [variant_for_level(card.level) for card in cards]

    pockets = [_filled_pocket(card, variant) for card, variant in zip(cards, variants)]
    pockets += [_empty_sleeve()] * (POCKETS_PER_PAGE - len(pockets))
    pockets_html = "".join(pockets)

    css = _MINI_BASE_CSS
    if any(variant.holo for variant in variants):
        css += _MINI_HOLO_CSS
    if any(variant.sparkles for variant in variants):
        css += _MINI_SPARKLE_CSS

    return f"""
    <div class="hbinder" data-page="{binder.page}" data-total-pages="{binder.total_pages}" style="
      width:520px;
      border-radius:24px;
      padding:22px;
      background:{BINDER_THEME['bg']};
      border:1px solid {BINDER_THEME['border']};
      box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);
      font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
      color:{BINDER_THEME['text']};
    ">
      <div style="border:1px solid {BINDER_THEME['border']};border-radius:16px;padding:16px;">
        <div style="margin-bottom:14px;">
          <div style="font-size:18px;font-weight:800;">🗂 {owner}'s Binder</div>
          <div style="font-size:12px;color:{BINDER_THEME['subtext']};margin-top:2px;">
            {binder.total_followers} trainers collected · page {binder.page}/{binder.total_pages}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;">
          {pockets_html}
        </div>
      </div>
      <style>{css}</style>
    </div>
    """
