"""Level-based Pokemon TCG holo tiers matching pokemon-cards-css categories."""

from dataclasses import dataclass

STATIC = "/static/vendor/pokemon-cards-css/img"


@dataclass(frozen=True)
class Variant:
    """One holo tier — wire attributes match pokemon-cards-css Card.svelte."""

    name: str
    badge: str
    css_class: str
    data_rarity: str
    supertype: str
    subtypes: str
    trainer_gallery: bool = False
    masked: bool = False
    holo: bool = False
    sparkles: bool = False
    foil_style: str = ""
    mask_style: str = ""
    card_number: str = ""

    @property
    def rainbow_frame(self) -> bool:
        return self.data_rarity in ("rare rainbow", "rare rainbow alt")

    @property
    def gold_frame(self) -> bool:
        return self.data_rarity == "rare secret"


COMMON = Variant(
    name="Common",
    badge="",
    css_class="hpk-v-common",
    data_rarity="common",
    supertype="trainer",
    subtypes="supporter",
    holo=False,
)

REVERSE_HOLO = Variant(
    name="Reverse Holo",
    badge="reverse",
    css_class="hpk-v-reverse",
    data_rarity="uncommon reverse holo",
    supertype="trainer",
    subtypes="supporter",
    masked=True,
    holo=True,
    foil_style=f"url({STATIC}/angular.png)",
    mask_style=f"url({STATIC}/wave.png)",
)

HOLO_RARE = Variant(
    name="Holo Rare",
    badge="holo",
    css_class="hpk-v-holo",
    data_rarity="rare holo",
    supertype="trainer",
    subtypes="supporter",
    holo=True,
)

COSMOS = Variant(
    name="Cosmos Holo",
    badge="cosmos",
    css_class="hpk-v-cosmos",
    data_rarity="rare holo cosmos",
    supertype="trainer",
    subtypes="supporter",
    holo=True,
)

AMAZING = Variant(
    name="Amazing Rare",
    badge="amazing",
    css_class="hpk-v-amazing",
    data_rarity="amazing rare",
    supertype="trainer",
    subtypes="supporter",
    masked=True,
    holo=True,
    sparkles=True,
    foil_style=f"url({STATIC}/glitter.png)",
    mask_style=f"url({STATIC}/geometric.png)",
)

RADIANT = Variant(
    name="Radiant",
    badge="radiant",
    css_class="hpk-v-radiant",
    data_rarity="radiant rare",
    supertype="trainer",
    subtypes="radiant",
    holo=True,
    sparkles=True,
)

TRAINER_GALLERY = Variant(
    name="Trainer Gallery",
    badge="TG",
    css_class="hpk-v-tg",
    data_rarity="rare holo",
    supertype="trainer",
    subtypes="supporter",
    trainer_gallery=True,
    holo=True,
    card_number="TG01",
)

POKEMON_V = Variant(
    name="Pokemon V",
    badge="V",
    css_class="hpk-v-v",
    data_rarity="rare holo v",
    supertype="pokémon",
    subtypes="basic v",
    holo=True,
)

V_FULL_ART = Variant(
    name="V Full Art",
    badge="V FA",
    css_class="hpk-v-vfa",
    data_rarity="rare ultra",
    supertype="pokémon",
    subtypes="basic v",
    holo=True,
    sparkles=True,
    foil_style=f"url({STATIC}/illusion.png)",
)

V_ALT_ART = Variant(
    name="V Alt Art",
    badge="V AA",
    css_class="hpk-v-vaa",
    data_rarity="rare ultra",
    supertype="pokémon",
    subtypes="basic v",
    holo=True,
    sparkles=True,
    foil_style=f"url({STATIC}/illusion.png)",
    mask_style=f"url({STATIC}/illusion-mask.png)",
    masked=True,
)

VMAX = Variant(
    name="VMax",
    badge="VMAX",
    css_class="hpk-v-vmax",
    data_rarity="rare holo vmax",
    supertype="pokémon",
    subtypes="vmax",
    holo=True,
    sparkles=True,
)

VMAX_RAINBOW = Variant(
    name="VMax Rainbow",
    badge="VMAX ★",
    css_class="hpk-v-vmax-r",
    data_rarity="rare rainbow",
    supertype="pokémon",
    subtypes="vmax",
    holo=True,
    sparkles=True,
)

VSTAR = Variant(
    name="VStar",
    badge="VSTAR",
    css_class="hpk-v-vstar",
    data_rarity="rare holo vstar",
    supertype="pokémon",
    subtypes="vstar",
    holo=True,
    sparkles=True,
)

SECRET_GOLD = Variant(
    name="Secret Gold",
    badge="★ gold",
    css_class="hpk-v-gold",
    data_rarity="rare secret",
    supertype="trainer",
    subtypes="supporter",
    holo=True,
    sparkles=True,
    foil_style=f"url({STATIC}/geometric.png)",
)

VARIANTS: tuple[Variant, ...] = (
    COMMON,
    REVERSE_HOLO,
    HOLO_RARE,
    COSMOS,
    AMAZING,
    RADIANT,
    TRAINER_GALLERY,
    POKEMON_V,
    V_FULL_ART,
    V_ALT_ART,
    VMAX,
    VMAX_RAINBOW,
    VSTAR,
    SECRET_GOLD,
)

_TIER_THRESHOLDS: tuple[tuple[int, Variant], ...] = (
    (94, SECRET_GOLD),
    (87, VSTAR),
    (80, VMAX_RAINBOW),
    (73, VMAX),
    (66, V_ALT_ART),
    (59, V_FULL_ART),
    (52, POKEMON_V),
    (45, TRAINER_GALLERY),
    (38, RADIANT),
    (31, AMAZING),
    (24, COSMOS),
    (17, HOLO_RARE),
    (10, REVERSE_HOLO),
)


def variant_for_level(level: int) -> Variant:
    """Return the pokemon-cards-css tier for a Hugging Face profile level."""
    for threshold, variant in _TIER_THRESHOLDS:
        if level >= threshold:
            return variant
    return COMMON


def foil_mask_style(variant: Variant) -> str:
    """Inline --foil / --mask for card__front when the tier needs masking."""
    parts: list[str] = []
    if variant.foil_style:
        parts.append(f"--foil:{variant.foil_style}")
    if variant.mask_style:
        parts.append(f"--mask:{variant.mask_style}")
    return ";".join(parts)
