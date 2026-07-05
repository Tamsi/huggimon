"""Render an animated Pokemon-TCG-style HTML card using pokemon-cards-css holo layers."""

import html

from src.card_variant import foil_mask_style, variant_for_level
from src.pokemon_card_css import (
    CARD_BACK_URL,
    card_seed_style,
    energy_type_class,
    render_interact_script,
    render_stylesheet_links,
    stage_subtype,
)
from src.scoring import CardData
from src.tcg_card_layout import safe_rarity, stage_label

# Layer class names used by pokemon-cards-css (kept for tests).
HOLO_CLASS = "card__shine"
SPARKLE_CLASS = "card__glare"


def _wire_subtypes(variant, stage: str) -> str:
    if variant.supertype == "pokémon":
        return variant.subtypes
    if variant.trainer_gallery or variant.subtypes == "radiant":
        return variant.subtypes
    if stage != "Basic":
        return stage_subtype(stage)
    return variant.subtypes or "supporter"


def _wire_number(variant, card: CardData) -> str:
    if variant.trainer_gallery:
        return f"TG{card.level:02d}"
    return str(card.level)


def render_pokecard_html(card: CardData, *, face_url: str, include_stylesheets: bool = True) -> str:
    """Return a self-contained card fragment: TCG face image + holo CSS + tilt JS.

    The face must be a 660×921 PNG (see tcg_face_renderer) so clip-paths align.
    """
    variant = variant_for_level(card.level)
    stage = stage_label(card)
    type_class = energy_type_class(card.energy_name)
    rarity_class = f"hpk-{safe_rarity(card).lower()}"
    subtypes = _wire_subtypes(variant, stage)
    card_number = _wire_number(variant, card)

    masked_class = " masked" if variant.masked else ""
    foil_mask = foil_mask_style(variant)
    front_style = card_seed_style(card.username)
    if foil_mask:
        front_style = f"{front_style};{foil_mask}"

    face_src = html.escape(face_url, quote=True)
    back_src = html.escape(CARD_BACK_URL, quote=True)
    name = html.escape(card.display_name)
    seed = card_seed_style(card.username)
    aria = html.escape(f"Trainer card for {card.display_name}")
    tg_attr = "true" if variant.trainer_gallery else "false"

    return f"""
{render_stylesheet_links() if include_stylesheets else ""}
<div class="card interactive hpk-tcg{masked_class} {type_class} {rarity_class} {variant.css_class}"
  data-rarity="{html.escape(variant.data_rarity)}"
  data-supertype="{html.escape(variant.supertype)}"
  data-subtypes="{html.escape(subtypes)}"
  data-trainer-gallery="{tg_attr}"
  data-set="huggimon"
  data-number="{html.escape(card_number)}"
  style="{seed}">
  <div class="card__translater">
    <button type="button" class="card__rotator" aria-label="{aria}" tabindex="0">
      <img class="card__back" src="{back_src}" alt="" loading="lazy" width="660" height="921"/>
      <div class="card__front" style="{front_style}">
        <img src="{face_src}" alt="Front of {name} trainer card" loading="eager" width="660" height="921"/>
        <div class="{HOLO_CLASS}"></div>
        <div class="{SPARKLE_CLASS}"></div>
      </div>
    </button>
  </div>
</div>
{render_interact_script()}
"""
