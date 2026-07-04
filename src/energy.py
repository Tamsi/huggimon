"""Pokemon-style energy mapping: card types to energy, likes to energy count."""

import math
from dataclasses import dataclass


@dataclass
class EnergyInfo:
    name: str
    symbol: str
    color: tuple[int, int, int]


ENERGY_BY_TYPE: dict[str, EnergyInfo] = {
    "Code": EnergyInfo("Lightning", "⚡", (250, 204, 21)),
    "Vision": EnergyInfo("Fire", "🔥", (239, 68, 68)),
    "Audio": EnergyInfo("Water", "💧", (59, 130, 246)),
    "NLP": EnergyInfo("Psychic", "🔮", (168, 85, 247)),
    "Multimodal": EnergyInfo("Rainbow", "🌈", (236, 72, 153)),
    "Agent": EnergyInfo("Metal", "⚙️", (148, 163, 184)),
    "Dataset": EnergyInfo("Grass", "🌿", (34, 197, 94)),
}

COLORLESS: EnergyInfo = EnergyInfo("Colorless", "✦", (203, 213, 225))


def energy_for_type(type_name: str) -> EnergyInfo:
    """Return the energy matching a card type, or Colorless for unknown types."""
    return ENERGY_BY_TYPE.get(type_name, COLORLESS)


def energy_count_from_likes(likes: int) -> int:
    """Convert total likes into an energy card count (0 to 8, log2 scale)."""
    if likes <= 0:
        return 0
    return min(8, 1 + int(math.log2(likes)))
