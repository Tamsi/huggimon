"""Tests for pokemon-cards-css integration helpers."""

from src.card_variant import (
    AMAZING,
    COMMON,
    COSMOS,
    HOLO_RARE,
    POKEMON_V,
    REVERSE_HOLO,
    SECRET_GOLD,
    VMAX,
    VMAX_RAINBOW,
)
from src.pokemon_card_css import (
    energy_type_class,
    render_stylesheet_links,
    stage_subtype,
    tcg_rarity_for_variant,
)


class TestTcgRarityMapping:
    def test_common(self):
        assert tcg_rarity_for_variant(COMMON) == "common"

    def test_holo_tiers(self):
        assert tcg_rarity_for_variant(REVERSE_HOLO) == "uncommon reverse holo"
        assert tcg_rarity_for_variant(HOLO_RARE) == "rare holo"
        assert tcg_rarity_for_variant(COSMOS) == "rare holo cosmos"
        assert tcg_rarity_for_variant(AMAZING) == "amazing rare"
        assert tcg_rarity_for_variant(POKEMON_V) == "rare holo v"
        assert tcg_rarity_for_variant(VMAX) == "rare holo vmax"
        assert tcg_rarity_for_variant(VMAX_RAINBOW) == "rare rainbow"
        assert tcg_rarity_for_variant(SECRET_GOLD) == "rare secret"


class TestStylesheets:
    def test_includes_full_upstream_stack(self):
        links = render_stylesheet_links()
        assert "base.css" in links
        assert "regular-holo.css" in links
        assert "cosmos-holo.css" in links
        assert "trainer-gallery-holo.css" in links
        assert "v-regular.css" in links
        assert "rainbow-holo.css" in links
        assert "secret-rare.css" in links
        assert "shiny-v.css" in links
        assert "huggimon-overrides.css" in links


class TestEnergyClass:
    def test_lightning(self):
        assert energy_type_class("Lightning") == "lightning"


class TestStageSubtype:
    def test_maps_stages(self):
        assert stage_subtype("Basic") == "basic"
        assert stage_subtype("Stage 1") == "stage1"
