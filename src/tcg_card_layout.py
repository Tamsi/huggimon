"""Shared Pokemon TCG card layout helpers for HTML and PNG face rendering."""

from typing import List, Tuple

from src.energy import COLORLESS, ENERGY_BY_TYPE, EnergyInfo
from src.scoring import CardData

MAX_HP = 340
CARD_SET_SIZE = 151

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


def hp_value(card: CardData) -> int:
    return min(MAX_HP, round((60 + card.level * 2) / 10) * 10)


def stage_label(card: CardData) -> str:
    arrows = card.evolution.count("→")
    if arrows == 0:
        return "Basic"
    if arrows == 1:
        return "Stage 1"
    return "Stage 2"


def attack_rows(card: CardData) -> List[Tuple[str, int, int]]:
    top_stats = sorted(
        [card.stats.model, card.stats.data, card.stats.space], reverse=True
    )[:2]
    rows = []
    for name, stat in zip(card.attacks[:2], top_stats):
        damage = max(10, round(stat / 10) * 10)
        cost = min(4, 1 + stat // 40)
        rows.append((name, damage, cost))
    return rows


def weakness_symbol(card: CardData) -> str:
    weak_name = WEAKNESS_BY_ENERGY.get(card.energy_name, "Psychic")
    return ENERGY_BY_NAME[weak_name].symbol


def safe_rarity(card: CardData) -> str:
    return card.rarity if card.rarity in RARITY_SYMBOLS else "Common"


def retreat_cost(card: CardData) -> int:
    total_repos = card.total_models + card.total_datasets + card.total_spaces
    if total_repos < 10:
        return 1
    if total_repos < 50:
        return 2
    return 3
