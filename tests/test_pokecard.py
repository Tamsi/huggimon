"""Tests for the Pokemon-style card HTML renderer."""

import html
from collections import Counter
from html.parser import HTMLParser

from src.energy import COLORLESS, ENERGY_BY_TYPE
from src.pokecard_html import HOLO_CLASS, SPARKLE_CLASS, render_pokecard_html
from src.scoring import CardData, CardStats
from src.tcg_card_layout import (
    WEAKNESS_BY_ENERGY,
    attack_rows,
    hp_value,
    retreat_cost,
    stage_label,
    weakness_symbol,
)

FACE_URL = "/api/card/tamsi/face.png"


def _make_card(**overrides) -> CardData:
    defaults = dict(
        username="tamsi",
        display_name="Tamsi",
        level=42,
        type="Code",
        rarity="Rare",
        stats=CardStats(85, 50, 30, 60, 20, 70),
        attacks=["Model Overload", "Dataset Tsunami"],
        passive="Open Source Aura",
        evolution="Contributor → Builder",
        total_models=5,
        total_datasets=2,
        total_spaces=1,
        total_followers=10,
        total_downloads=100,
        total_likes=50,
        energy_name="Lightning",
        energy_symbol="⚡",
        energy_count=5,
        avatar_url=None,
    )
    defaults.update(overrides)
    return CardData(**defaults)


def _render(**overrides) -> str:
    return render_pokecard_html(_make_card(**overrides), face_url=FACE_URL)


class TestHp:
    def test_mid_level(self):
        assert hp_value(_make_card(level=42)) == 140

    def test_cap_at_340(self):
        assert hp_value(_make_card(level=200)) == 340


class TestStage:
    def test_no_arrow_is_basic(self):
        assert stage_label(_make_card(evolution="Contributor")) == "Basic"

    def test_one_arrow_is_stage_1(self):
        assert stage_label(_make_card(evolution="Contributor → Builder")) == "Stage 1"


class TestAttackRows:
    def test_damage_and_cost_from_top_stats(self):
        card = _make_card(stats=CardStats(85, 50, 30, 0, 0, 0))
        assert attack_rows(card) == [("Model Overload", 80, 3), ("Dataset Tsunami", 50, 2)]


class TestWeakness:
    def test_map_covers_every_energy_name(self):
        names = {e.name for e in ENERGY_BY_TYPE.values()} | {COLORLESS.name}
        for name in names:
            assert name in WEAKNESS_BY_ENERGY

    def test_lightning_is_weak_to_grass(self):
        assert weakness_symbol(_make_card(energy_name="Lightning")) == "🌿"


class TestRetreat:
    def test_thresholds(self):
        assert retreat_cost(_make_card(total_models=9, total_datasets=0, total_spaces=0)) == 1
        assert retreat_cost(_make_card(total_models=50, total_datasets=0, total_spaces=0)) == 3


class TestMarkupStructure:
    def test_uses_pokemon_cards_css_structure(self):
        doc = _render()
        assert 'class="card interactive hpk-tcg' in doc
        assert "card__translater" in doc
        assert "card__rotator" in doc
        assert "card__front" in doc
        assert HOLO_CLASS in doc
        assert SPARKLE_CLASS in doc
        assert FACE_URL in doc
        assert 'width="660"' in doc
        assert "regular-holo.css" in doc
        assert "pokemon-cards-css" in doc

    def test_face_image_alt_contains_display_name(self):
        doc = _render()
        assert 'alt="Front of Tamsi trainer card"' in doc

    def test_trainer_data_attributes(self):
        doc = _render(level=20)
        assert 'data-supertype="trainer"' in doc
        assert 'data-subtypes="stage1"' in doc


class TestVariant:
    def test_level_5_common(self):
        doc = _render(level=5)
        assert "hpk-v-common" in doc
        assert 'data-rarity="common"' in doc

    def test_level_12_reverse_holo(self):
        doc = _render(level=12)
        assert "hpk-v-reverse" in doc
        assert 'data-rarity="uncommon reverse holo"' in doc
        assert " masked" in doc
        assert "reverse-holo.css" in doc

    def test_level_20_holo_rare(self):
        doc = _render(level=20)
        assert "hpk-v-holo" in doc
        assert 'data-rarity="rare holo"' in doc

    def test_level_28_cosmos(self):
        doc = _render(level=28)
        assert "hpk-v-cosmos" in doc
        assert 'data-rarity="rare holo cosmos"' in doc
        assert "cosmos-holo.css" in doc

    def test_level_55_pokemon_v(self):
        doc = _render(level=55)
        assert "hpk-v-v" in doc
        assert 'data-rarity="rare holo v"' in doc
        assert 'data-supertype="pokémon"' in doc
        assert "v-regular.css" in doc

    def test_level_75_vmax(self):
        doc = _render(level=75)
        assert "hpk-v-vmax" in doc
        assert 'data-rarity="rare holo vmax"' in doc
        assert "v-max.css" in doc

    def test_level_85_vmax_rainbow(self):
        doc = _render(level=85)
        assert "hpk-v-vmax-r" in doc
        assert 'data-rarity="rare rainbow"' in doc
        assert "rainbow-holo.css" in doc

    def test_level_100_secret_gold(self):
        doc = _render(level=100)
        assert "hpk-v-gold" in doc
        assert 'data-rarity="rare secret"' in doc
        assert "secret-rare.css" in doc

    def test_level_48_trainer_gallery(self):
        doc = _render(level=48)
        assert "hpk-v-tg" in doc
        assert 'data-trainer-gallery="true"' in doc
        assert 'data-number="TG48"' in doc
        assert "trainer-gallery-holo.css" in doc


class TestRarity:
    def test_unknown_rarity_falls_back_to_common_class(self):
        payload = 'X" onmouseover="alert(1)'
        doc = _render(rarity=payload)
        assert "hpk-common" in doc
        assert payload not in doc


class TestEscaping:
    def test_display_name_in_alt_is_escaped(self):
        payload = "<script>alert(1)</script>"
        doc = _render(display_name=payload)
        assert html.escape(payload) in doc
        assert payload not in doc


class _TagCounter(HTMLParser):
    def __init__(self):
        super().__init__()
        self.starts: Counter = Counter()
        self.ends: Counter = Counter()

    def handle_starttag(self, tag, attrs):
        self.starts[tag] += 1

    def handle_endtag(self, tag):
        self.ends[tag] += 1


class TestWellFormedness:
    def test_wellformedness_div_tags_balanced(self):
        for level in (5, 12, 20, 55, 75, 85, 100):
            parser = _TagCounter()
            parser.feed(_render(level=level))
            parser.close()
            assert parser.starts["div"] == parser.ends["div"], level
