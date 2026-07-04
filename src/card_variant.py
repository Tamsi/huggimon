"""Pokemon-TCG-style card variant tiers (plain / holo / ex / GX / shiny / gold) driven by card level."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Variant:
    name: str
    badge: str  # short label shown next to a card name, empty when none
    css_class: str
    holo: bool
    sparkles: bool
    rainbow_frame: bool
    gold_frame: bool


STANDARD = Variant(
    name="Standard",
    badge="",
    css_class="hpk-v-standard",
    holo=False,
    sparkles=False,
    rainbow_frame=False,
    gold_frame=False,
)

HOLO = Variant(
    name="Holo",
    badge="",
    css_class="hpk-v-holo",
    holo=True,
    sparkles=False,
    rainbow_frame=False,
    gold_frame=False,
)

EX = Variant(
    name="ex",
    badge="ex",
    css_class="hpk-v-ex",
    holo=True,
    sparkles=False,
    rainbow_frame=False,
    gold_frame=False,
)

GX = Variant(
    name="GX",
    badge="GX",
    css_class="hpk-v-gx",
    holo=True,
    sparkles=True,
    rainbow_frame=False,
    gold_frame=False,
)

SHINY = Variant(
    name="Shiny",
    badge="✦ shiny",
    css_class="hpk-v-shiny",
    holo=True,
    sparkles=True,
    rainbow_frame=True,
    gold_frame=False,
)

GOLD = Variant(
    name="Gold",
    badge="★ gold",
    css_class="hpk-v-gold",
    holo=True,
    sparkles=True,
    rainbow_frame=False,
    gold_frame=True,
)

VARIANTS: tuple[Variant, ...] = (STANDARD, HOLO, EX, GX, SHINY, GOLD)

# Minimum level required for each tier above Standard, highest first so the
# first match in variant_for_level wins.
_TIER_THRESHOLDS: tuple[tuple[int, Variant], ...] = (
    (105, GOLD),
    (85, SHINY),
    (65, GX),
    (45, EX),
    (25, HOLO),
)


def variant_for_level(level: int) -> Variant:
    """Return the card variant matching a level (Standard below 25, Gold at 105+)."""
    for threshold, variant in _TIER_THRESHOLDS:
        if level >= threshold:
            return variant
    return STANDARD
