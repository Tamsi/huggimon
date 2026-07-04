"""Render an animated Pokemon-TCG-style HTML card fragment for a CardData."""

import html
from typing import List, Tuple

from src.energy import COLORLESS, ENERGY_BY_TYPE, EnergyInfo
from src.scoring import CardData

MAX_HP = 340
CARD_SET_SIZE = 151

HOLO_CLASS = "hpk-holo"
SPARKLE_CLASS = "hpk-sparkles"

HOLO_RARITIES = {"Rare", "Epic", "Legendary"}
SPARKLE_RARITIES = {"Epic", "Legendary"}

RARITY_SYMBOLS = {"Common": "●", "Rare": "◆", "Epic": "★", "Legendary": "★"}

ENERGY_BY_NAME: dict[str, EnergyInfo] = {e.name: e for e in ENERGY_BY_TYPE.values()}
ENERGY_BY_NAME[COLORLESS.name] = COLORLESS

WEAKNESS_BY_ENERGY = {
    "Fire": "Water",
    "Water": "Lightning",
    "Lightning": "Grass",
    "Grass": "Fire",
    "Psychic": "Metal",
    "Metal": "Fire",
    "Rainbow": "Psychic",
    "Colorless": "Psychic",
}


def _hp(card: CardData) -> int:
    return min(MAX_HP, round((60 + card.level * 2) / 10) * 10)


def _stage(card: CardData) -> str:
    arrows = card.evolution.count("→")
    if arrows == 0:
        return "Basic"
    if arrows == 1:
        return "Stage 1"
    return "Stage 2"


def _attack_rows(card: CardData) -> List[Tuple[str, int, int]]:
    """Pair each attack (max 2) with the highest repo stats, giving (name, damage, cost)."""
    top_stats = sorted(
        [card.stats.model, card.stats.data, card.stats.space], reverse=True
    )[:2]
    rows = []
    for name, stat in zip(card.attacks[:2], top_stats):
        damage = max(10, round(stat / 10) * 10)
        cost = min(4, 1 + stat // 40)
        rows.append((name, damage, cost))
    return rows


def _weakness(card: CardData) -> str:
    """Return the symbol of the energy this card is weak against."""
    weak_name = WEAKNESS_BY_ENERGY.get(card.energy_name, "Psychic")
    return ENERGY_BY_NAME[weak_name].symbol


def _safe_rarity(card: CardData) -> str:
    """Allowlist the rarity value; unknown strings fall back to Common.

    The rarity feeds CSS class names and overlay gating, so an allowlist is
    safer than escaping.
    """
    return card.rarity if card.rarity in RARITY_SYMBOLS else "Common"


def _retreat(card: CardData) -> int:
    total_repos = card.total_models + card.total_datasets + card.total_spaces
    if total_repos < 10:
        return 1
    if total_repos < 50:
        return 2
    return 3


def _color_vars(card: CardData) -> str:
    """CSS custom properties for the energy tint, injected on the root div."""
    r, g, b = ENERGY_BY_NAME.get(card.energy_name, COLORLESS).color
    c1 = tuple(round(ch + (255 - ch) * 0.75) for ch in (r, g, b))
    c2 = tuple(min(255, round(ch * 0.85 + 38)) for ch in (r, g, b))
    return (
        f"--hpk-c1:rgb({c1[0]},{c1[1]},{c1[2]});"
        f"--hpk-c2:rgb({c2[0]},{c2[1]},{c2[2]});"
        f"--hpk-e:rgb({r},{g},{b});"
        f"--hpk-glow:rgba({r},{g},{b},0.55);"
    )


def _art_html(card: CardData) -> str:
    if card.avatar_url:
        src = html.escape(card.avatar_url, quote=True)
        return f'<img class="hpk-avatar" src="{src}" alt=""/>'
    initial = html.escape((card.username[:1] or "?").upper())
    return f'<span class="hpk-initial">{initial}</span>'


def _attack_row_html(name: str, damage: int, cost: int, symbol: str) -> str:
    icons = "".join(f'<span class="hpk-cost">{symbol}</span>' for _ in range(cost))
    return (
        '<div class="hpk-attack">'
        f'<span class="hpk-costs">{icons}</span>'
        f'<span class="hpk-attack-name">{html.escape(name)}</span>'
        f'<span class="hpk-damage">{damage}</span>'
        "</div>"
    )


_BASE_CSS = """
.hpk-card{position:relative;width:min(420px,92vw);aspect-ratio:63/88;border-radius:18px;
  padding:10px;box-sizing:border-box;color:#1f2937;
  font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  box-shadow:0 20px 45px -18px rgba(0,0,0,0.55),0 0 26px -6px var(--hpk-glow);
  animation:hpk-float 6s ease-in-out infinite;will-change:transform;}
.hpk-common{background:#cbd5e1;}
.hpk-rare,.hpk-epic{background:linear-gradient(135deg,#f5d76e,#b8860b,#f5d76e);}
.hpk-legendary{background:linear-gradient(90deg,#ff004d,#ff7a00,#ffe600,#00e05a,#00b3ff,#8a2be2,#ff004d);
  background-size:400% 100%;
  animation:hpk-float 6s ease-in-out infinite,hpk-rainbow 8s linear infinite;}
.hpk-inner{position:relative;width:100%;height:100%;border-radius:10px;overflow:hidden;
  background:linear-gradient(180deg,var(--hpk-c1),var(--hpk-c2));
  display:flex;flex-direction:column;padding:12px;box-sizing:border-box;}
.hpk-header{display:flex;align-items:baseline;gap:7px;}
.hpk-stage{font-size:9px;font-weight:700;padding:2px 7px;border-radius:999px;
  background:rgba(255,255,255,0.72);white-space:nowrap;}
.hpk-name{flex:1;font-size:20px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hpk-hp{color:#dc2626;font-weight:900;font-size:22px;white-space:nowrap;}
.hpk-hp-label{font-size:11px;vertical-align:2px;}
.hpk-energy{font-size:18px;}
.hpk-art{margin-top:8px;height:40%;flex:none;border:5px solid #d4af37;border-radius:4px;
  box-shadow:inset 0 0 10px rgba(0,0,0,0.35);overflow:hidden;
  background:linear-gradient(160deg,var(--hpk-c1),var(--hpk-e));
  display:flex;align-items:center;justify-content:center;}
.hpk-avatar{width:100%;height:100%;object-fit:cover;display:block;}
.hpk-initial{font-size:64px;font-weight:900;color:rgba(31,41,55,0.55);text-transform:uppercase;}
.hpk-info{width:92%;margin:7px auto 0;padding:3px 8px;border-radius:4px;text-align:center;
  font-size:10px;font-style:italic;font-weight:600;
  background:linear-gradient(90deg,#e9c866,#f6e3a1,#e9c866);box-shadow:0 1px 2px rgba(0,0,0,0.25);}
.hpk-ability{margin-top:8px;font-size:11px;line-height:1.35;}
.hpk-ability-tag{background:#b91c1c;color:#fff;font-size:9px;font-weight:800;
  padding:1px 7px;border-radius:999px;margin-right:6px;vertical-align:1px;}
.hpk-ability-name{font-weight:800;}
.hpk-ability-text{font-size:10px;opacity:0.85;}
.hpk-attacks{margin-top:6px;display:flex;flex-direction:column;gap:5px;}
.hpk-attack{display:flex;align-items:center;gap:7px;padding:4px 2px;
  border-top:1px solid rgba(31,41,55,0.22);}
.hpk-costs{display:flex;gap:3px;flex:none;}
.hpk-cost{width:17px;height:17px;border-radius:50%;background:var(--hpk-e);
  border:1px solid rgba(31,41,55,0.4);display:inline-flex;align-items:center;justify-content:center;
  font-size:9px;line-height:1;}
.hpk-attack-name{flex:1;font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hpk-damage{font-size:20px;font-weight:800;}
.hpk-divider{margin-top:auto;border-top:2px solid rgba(31,41,55,0.35);}
.hpk-footer{display:flex;justify-content:space-between;align-items:center;gap:8px;
  margin-top:5px;font-size:10px;font-weight:700;}
.hpk-footer-label{font-size:8px;text-transform:uppercase;letter-spacing:1px;opacity:0.7;
  display:block;font-weight:600;}
.hpk-flavor{margin-top:4px;font-size:9px;font-style:italic;opacity:0.8;}
.hpk-watermark{margin-top:2px;font-size:9px;letter-spacing:2px;text-align:right;opacity:0.55;font-weight:700;}
.hpk-glare{position:absolute;inset:0;border-radius:18px;pointer-events:none;
  background:radial-gradient(circle at var(--hpk-mx,35%) var(--hpk-my,30%),rgba(255,255,255,0.5),rgba(255,255,255,0) 58%);
  background-size:200% 200%;mix-blend-mode:soft-light;animation:hpk-glare 7s ease-in-out infinite;}
@keyframes hpk-float{0%,100%{transform:translateY(-6px);}50%{transform:translateY(6px);}}
@keyframes hpk-rainbow{0%{background-position:0% 50%;}100%{background-position:400% 50%;}}
@keyframes hpk-glare{0%,100%{background-position:0% 0%;}50%{background-position:100% 100%;}}
@media (prefers-reduced-motion: reduce){
  .hpk-card,.hpk-layer{animation:none !important;}
}
"""

_HOLO_CSS = """
.hpk-holo{position:absolute;inset:10px;border-radius:10px;pointer-events:none;opacity:0.18;
  background:linear-gradient(60deg,#ff004d,#ff7a00,#ffe600,#00e05a,#00b3ff,#8a2be2,#ff004d);
  background-size:300% 300%;mix-blend-mode:color-dodge;animation:hpk-holo-shift 6s linear infinite;}
@keyframes hpk-holo-shift{0%{background-position:0% 0%;}50%{background-position:100% 100%;}100%{background-position:0% 0%;}}
"""

_SPARKLE_CSS = """
.hpk-sparkles{position:absolute;inset:10px;border-radius:10px;pointer-events:none;
  background-image:
    radial-gradient(circle 1.5px at 22px 34px,#fff 92%,transparent),
    radial-gradient(circle 2px at 68px 12px,#fff 92%,transparent),
    radial-gradient(circle 1px at 44px 76px,#fffbe6 92%,transparent);
  background-size:90px 90px,130px 130px,70px 70px;
  animation:hpk-sparkle 3.2s ease-in-out infinite;}
@keyframes hpk-sparkle{0%,100%{opacity:0.15;}50%{opacity:0.65;}}
"""

_TILT_SCRIPT = """
(function () {
  document.querySelectorAll('.hpk-card').forEach(function (card) {
    if (card.hasAttribute('data-hpk-bound')) return;
    card.setAttribute('data-hpk-bound', '1');
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      var py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      var ry = ((px - 0.5) * 24).toFixed(2);
      var rx = ((0.5 - py) * 24).toFixed(2);
      card.style.animation = 'none';
      card.style.transition = 'none';
      card.style.transform =
        'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      card.style.setProperty('--hpk-mx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--hpk-my', (py * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', function () {
      card.style.transition = 'transform 0.4s ease';
      card.style.transform = '';
      card.style.removeProperty('--hpk-mx');
      card.style.removeProperty('--hpk-my');
      window.setTimeout(function () {
        card.style.transition = '';
        card.style.animation = '';
      }, 400);
    });
  });
})();
"""


def render_pokecard_html(card: CardData) -> str:
    """Return a self-contained Pokemon-style card fragment (markup + style + tilt script)."""
    rarity = _safe_rarity(card)
    rarity_class = f"hpk-{rarity.lower()}"
    symbol = html.escape(card.energy_symbol)
    hp = _hp(card)
    rows = _attack_rows(card)
    attacks_html = "".join(_attack_row_html(n, d, c, symbol) for n, d, c in rows)

    overlays = '<div class="hpk-layer hpk-glare"></div>'
    css = _BASE_CSS
    if rarity in HOLO_RARITIES:
        overlays += f'<div class="hpk-layer {HOLO_CLASS}"></div>'
        css += _HOLO_CSS
    if rarity in SPARKLE_RARITIES:
        overlays += f'<div class="hpk-layer {SPARKLE_CLASS}"></div>'
        css += _SPARKLE_CSS

    return f"""
<div class="hpk-card {rarity_class}" style="{_color_vars(card)}">
  <div class="hpk-inner">
    <div class="hpk-header">
      <span class="hpk-stage">{_stage(card)}</span>
      <span class="hpk-name">{html.escape(card.display_name)}</span>
      <span class="hpk-hp"><span class="hpk-hp-label">HP</span> {hp}</span>
      <span class="hpk-energy" title="{html.escape(card.energy_name, quote=True)}">{symbol}</span>
    </div>
    <div class="hpk-art">{_art_html(card)}</div>
    <div class="hpk-info">LV {card.level} · {html.escape(card.type)} Trainer · {card.total_models} models · {card.total_followers} followers</div>
    <div class="hpk-ability">
      <span class="hpk-ability-tag">Ability</span><span class="hpk-ability-name">{html.escape(card.passive)}</span>
      <div class="hpk-ability-text">Draws power from {card.total_likes} likes and {card.total_downloads} downloads.</div>
    </div>
    <div class="hpk-attacks">{attacks_html}</div>
    <div class="hpk-divider"></div>
    <div class="hpk-footer">
      <span><span class="hpk-footer-label">weakness</span>{_weakness(card)}×2</span>
      <span><span class="hpk-footer-label">retreat</span>{"●" * _retreat(card)}</span>
      <span><span class="hpk-footer-label">set</span>{RARITY_SYMBOLS[rarity]} {card.level}/{CARD_SET_SIZE}</span>
    </div>
    <div class="hpk-flavor">{html.escape(card.evolution)}</div>
    <div class="hpk-watermark">huggimon.space</div>
  </div>
  {overlays}
</div>
<style>{css}</style>
<script>{_TILT_SCRIPT}</script>
"""
