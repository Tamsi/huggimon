"""Unit tests for the level-based card variant tiers."""

import pytest

from src.card_variant import VARIANTS, Variant, variant_for_level


class TestVariantForLevel:
    @pytest.mark.parametrize(
        ("level", "expected_name"),
        [
            (24, "Standard"),
            (25, "Holo"),
            (44, "Holo"),
            (45, "ex"),
            (64, "ex"),
            (65, "GX"),
            (84, "GX"),
            (85, "Shiny"),
            (104, "Shiny"),
            (105, "Gold"),
            (300, "Gold"),
        ],
    )
    def test_tier_boundaries(self, level, expected_name):
        assert variant_for_level(level).name == expected_name

    @pytest.mark.parametrize("level", [-100, -1, 0])
    def test_non_positive_levels_are_standard(self, level):
        assert variant_for_level(level).name == "Standard"


class TestVariantProperties:
    @pytest.mark.parametrize(
        ("name", "holo", "sparkles", "rainbow_frame", "gold_frame"),
        [
            ("Standard", False, False, False, False),
            ("Holo", True, False, False, False),
            ("ex", True, False, False, False),
            ("GX", True, True, False, False),
            ("Shiny", True, True, True, False),
            ("Gold", True, True, False, True),
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
        ("name", "css_class"),
        [
            ("Standard", "hpk-v-standard"),
            ("Holo", "hpk-v-holo"),
            ("ex", "hpk-v-ex"),
            ("GX", "hpk-v-gx"),
            ("Shiny", "hpk-v-shiny"),
            ("Gold", "hpk-v-gold"),
        ],
    )
    def test_css_classes(self, name, css_class):
        variant = next(v for v in VARIANTS if v.name == name)
        assert variant.css_class == css_class

    @pytest.mark.parametrize(
        ("name", "badge"),
        [
            ("Standard", ""),
            ("Holo", ""),
            ("ex", "ex"),
            ("GX", "GX"),
            ("Shiny", "✦ shiny"),
            ("Gold", "★ gold"),
        ],
    )
    def test_badges(self, name, badge):
        variant = next(v for v in VARIANTS if v.name == name)
        assert variant.badge == badge


class TestVariantsConstant:
    def test_six_variants_in_ascending_tier_order(self):
        assert len(VARIANTS) == 6
        assert [v.name for v in VARIANTS] == ["Standard", "Holo", "ex", "GX", "Shiny", "Gold"]

    def test_matches_variant_for_level(self):
        representative_levels = [0, 25, 45, 65, 85, 105]
        assert [variant_for_level(lvl) for lvl in representative_levels] == list(VARIANTS)

    def test_entries_are_variant_instances(self):
        assert all(isinstance(v, Variant) for v in VARIANTS)
