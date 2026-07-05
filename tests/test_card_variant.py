"""Unit tests for the level-based card variant tiers."""

import pytest

from src.card_variant import VARIANTS, Variant, variant_for_level


class TestVariantForLevel:
    @pytest.mark.parametrize(
        ("level", "expected_name"),
        [
            (5, "Common"),
            (9, "Common"),
            (10, "Reverse Holo"),
            (16, "Reverse Holo"),
            (17, "Holo Rare"),
            (24, "Cosmos Holo"),
            (31, "Amazing Rare"),
            (38, "Radiant"),
            (45, "Trainer Gallery"),
            (52, "Pokemon V"),
            (59, "V Full Art"),
            (66, "V Alt Art"),
            (73, "VMax"),
            (80, "VMax Rainbow"),
            (87, "VStar"),
            (94, "Secret Gold"),
            (300, "Secret Gold"),
        ],
    )
    def test_tier_boundaries(self, level, expected_name):
        assert variant_for_level(level).name == expected_name

    @pytest.mark.parametrize("level", [-100, -1, 0])
    def test_non_positive_levels_are_common(self, level):
        assert variant_for_level(level).name == "Common"


class TestVariantProperties:
    @pytest.mark.parametrize(
        ("name", "holo", "sparkles", "rainbow_frame", "gold_frame"),
        [
            ("Common", False, False, False, False),
            ("Reverse Holo", True, False, False, False),
            ("Holo Rare", True, False, False, False),
            ("Cosmos Holo", True, False, False, False),
            ("Amazing Rare", True, True, False, False),
            ("Radiant", True, True, False, False),
            ("Trainer Gallery", True, False, False, False),
            ("Pokemon V", True, False, False, False),
            ("V Full Art", True, True, False, False),
            ("V Alt Art", True, True, False, False),
            ("VMax", True, True, False, False),
            ("VMax Rainbow", True, True, True, False),
            ("VStar", True, True, False, False),
            ("Secret Gold", True, True, False, True),
        ],
    )
    def test_flags_match_table(self, name, holo, sparkles, rainbow_frame, gold_frame):
        variant = next(v for v in VARIANTS if v.name == name)
        assert (variant.holo, variant.sparkles, variant.rainbow_frame, variant.gold_frame) == (
            holo,
            sparkles,
            rainbow_frame,
            gold_frame,
        )

    @pytest.mark.parametrize(
        ("name", "data_rarity"),
        [
            ("Common", "common"),
            ("Reverse Holo", "uncommon reverse holo"),
            ("Holo Rare", "rare holo"),
            ("Cosmos Holo", "rare holo cosmos"),
            ("Amazing Rare", "amazing rare"),
            ("Radiant", "radiant rare"),
            ("Trainer Gallery", "rare holo"),
            ("Pokemon V", "rare holo v"),
            ("V Full Art", "rare ultra"),
            ("V Alt Art", "rare ultra"),
            ("VMax", "rare holo vmax"),
            ("VMax Rainbow", "rare rainbow"),
            ("VStar", "rare holo vstar"),
            ("Secret Gold", "rare secret"),
        ],
    )
    def test_data_rarity_wire_values(self, name, data_rarity):
        variant = next(v for v in VARIANTS if v.name == name)
        assert variant.data_rarity == data_rarity


class TestVariantsConstant:
    def test_fourteen_variants_in_ascending_tier_order(self):
        assert len(VARIANTS) == 14
        assert VARIANTS[0].name == "Common"
        assert VARIANTS[-1].name == "Secret Gold"

    def test_matches_variant_for_level(self):
        representative_levels = [0, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 94]
        assert [variant_for_level(lvl) for lvl in representative_levels] == list(VARIANTS)

    def test_entries_are_variant_instances(self):
        assert all(isinstance(v, Variant) for v in VARIANTS)
