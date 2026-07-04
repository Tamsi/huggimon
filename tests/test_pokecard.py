"""Tests for the Pokemon-style card HTML renderer."""

import html
from collections import Counter
from html.parser import HTMLParser

from src.energy import COLORLESS, ENERGY_BY_TYPE
from src.pokecard_html import (
    HOLO_CLASS,
    SPARKLE_CLASS,
    WEAKNESS_BY_ENERGY,
    _attack_rows,
    _hp,
    _retreat,
    _stage,
    _weakness,
    render_pokecard_html,
)
from src.scoring import CardData, CardStats


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


class TestHp:
    def test_mid_level(self):
        # 60 + 42*2 = 144 -> round(14.4)*10 = 140
        assert _hp(_make_card(level=42)) == 140

    def test_cap_at_340(self):
        # 60 + 200*2 = 460 -> capped at 340
        assert _hp(_make_card(level=200)) == 340

    def test_low_level(self):
        # 60 + 1*2 = 62 -> round(6.2)*10 = 60
        assert _hp(_make_card(level=1)) == 60


class TestStage:
    def test_no_arrow_is_basic(self):
        assert _stage(_make_card(evolution="Contributor")) == "Basic"

    def test_one_arrow_is_stage_1(self):
        assert _stage(_make_card(evolution="Contributor → Builder")) == "Stage 1"

    def test_two_arrows_is_stage_2(self):
        card = _make_card(evolution="Contributor → Builder → Hub Legend")
        assert _stage(card) == "Stage 2"


class TestAttackRows:
    def test_damage_and_cost_from_top_stats(self):
        # Top stats: model=85, data=50 (space=30 dropped).
        # Python banker's rounding: round(8.5) == 8 -> damage 80.
        card = _make_card(stats=CardStats(85, 50, 30, 0, 0, 0))
        rows = _attack_rows(card)
        assert rows == [("Model Overload", 80, 3), ("Dataset Tsunami", 50, 2)]

    def test_damage_floor_and_min_cost(self):
        card = _make_card(stats=CardStats(3, 2, 1, 0, 0, 0))
        rows = _attack_rows(card)
        assert rows == [("Model Overload", 10, 1), ("Dataset Tsunami", 10, 1)]

    def test_cost_capped_at_4(self):
        card = _make_card(stats=CardStats(100, 100, 100, 0, 0, 0))
        rows = _attack_rows(card)
        assert all(cost == 3 for _, _, cost in rows)  # 1 + 100//40 = 3
        card = _make_card(stats=CardStats(160, 160, 160, 0, 0, 0))
        assert all(cost == 4 for _, _, cost in _attack_rows(card))

    def test_single_attack_gives_single_row(self):
        card = _make_card(attacks=["Fine-tune Blast"])
        rows = _attack_rows(card)
        assert len(rows) == 1
        assert rows[0][0] == "Fine-tune Blast"


class TestWeakness:
    def test_map_covers_every_energy_name(self):
        names = {e.name for e in ENERGY_BY_TYPE.values()} | {COLORLESS.name}
        for name in names:
            assert name in WEAKNESS_BY_ENERGY

    def test_exact_weakness_pairs(self):
        assert WEAKNESS_BY_ENERGY == {
            "Fire": "Water",
            "Water": "Lightning",
            "Lightning": "Grass",
            "Grass": "Fire",
            "Psychic": "Metal",
            "Metal": "Fire",
            "Rainbow": "Psychic",
            "Colorless": "Psychic",
        }

    def test_lightning_is_weak_to_grass(self):
        assert _weakness(_make_card(energy_name="Lightning")) == "🌿"

    def test_fragment_shows_weakness_times_two(self):
        doc = render_pokecard_html(_make_card(energy_name="Lightning"))
        assert "🌿×2" in doc


class TestRetreat:
    def test_thresholds(self):
        assert _retreat(_make_card(total_models=9, total_datasets=0, total_spaces=0)) == 1
        assert _retreat(_make_card(total_models=49, total_datasets=0, total_spaces=0)) == 2
        assert _retreat(_make_card(total_models=50, total_datasets=0, total_spaces=0)) == 3


class TestFragmentContent:
    def test_core_fields_present(self):
        doc = render_pokecard_html(_make_card())
        assert "Tamsi" in doc
        assert "HP" in doc
        assert "Model Overload" in doc
        assert "Dataset Tsunami" in doc
        assert "Stage 1" in doc
        assert "42/151" in doc
        assert "huggimon.space" in doc


class TestRarity:
    def test_legendary_has_sparkles_and_class(self):
        doc = render_pokecard_html(_make_card(rarity="Legendary"))
        assert "hpk-legendary" in doc
        assert SPARKLE_CLASS in doc
        assert HOLO_CLASS in doc

    def test_common_has_no_holo_or_sparkles(self):
        doc = render_pokecard_html(_make_card(rarity="Common"))
        assert "hpk-common" in doc
        assert SPARKLE_CLASS not in doc
        assert HOLO_CLASS not in doc

    def test_unknown_rarity_falls_back_to_common(self):
        payload = 'X" onmouseover="alert(1)'
        doc = render_pokecard_html(_make_card(rarity=payload))
        assert "hpk-common" in doc
        assert payload not in doc


class TestEscaping:
    def test_display_name_is_escaped(self):
        payload = "<script>alert(1)</script>"
        doc = render_pokecard_html(_make_card(display_name=payload))
        assert html.escape(payload) in doc
        # The fragment legitimately contains its own tilt <script> tag,
        # so assert on the full payload string rather than "<script>" alone.
        assert payload not in doc


class TestAvatar:
    def test_avatar_url_renders_img(self):
        url = "https://example.com/a.png?x=1&y=2"
        doc = render_pokecard_html(_make_card(avatar_url=url))
        assert "<img" in doc
        assert html.escape(url, quote=True) in doc

    def test_no_avatar_renders_initial(self):
        doc = render_pokecard_html(_make_card(avatar_url=None, username="tamsi"))
        assert "<img" not in doc
        assert 'class="hpk-initial">T<' in doc


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
    def test_div_and_span_tags_balanced(self):
        for rarity in ("Common", "Rare", "Epic", "Legendary"):
            parser = _TagCounter()
            parser.feed(render_pokecard_html(_make_card(rarity=rarity)))
            parser.close()
            for tag in ("div", "span"):
                assert parser.starts[tag] == parser.ends[tag], (rarity, tag)
