"""Unit tests for the energy module and its integration in build_card."""

import pytest

from src.energy import (
    COLORLESS,
    ENERGY_BY_TYPE,
    energy_count_from_likes,
    energy_for_type,
)
from src.hf_fetcher import HfProfileData, RepoItem, UserProfile
from src.scoring import build_card


class TestEnergyForType:
    @pytest.mark.parametrize(
        ("type_name", "expected_name", "expected_symbol", "expected_color"),
        [
            ("Code", "Lightning", "⚡", (250, 204, 21)),
            ("Vision", "Fire", "🔥", (239, 68, 68)),
            ("Audio", "Water", "💧", (59, 130, 246)),
            ("NLP", "Psychic", "🔮", (168, 85, 247)),
            ("Multimodal", "Rainbow", "🌈", (236, 72, 153)),
            ("Agent", "Metal", "⚙️", (148, 163, 184)),
            ("Dataset", "Grass", "🌿", (34, 197, 94)),
        ],
    )
    def test_known_types(self, type_name, expected_name, expected_symbol, expected_color):
        energy = energy_for_type(type_name)
        assert energy.name == expected_name
        assert energy.symbol == expected_symbol
        assert energy.color == expected_color

    def test_unknown_type_falls_back_to_colorless(self):
        energy = energy_for_type("Ghost")
        assert energy is COLORLESS
        assert energy.name == "Colorless"
        assert energy.symbol == "✦"
        assert energy.color == (203, 213, 225)

    def test_mapping_covers_all_card_types(self):
        assert set(ENERGY_BY_TYPE) == {
            "Code", "Vision", "Audio", "NLP", "Multimodal", "Agent", "Dataset",
        }


class TestEnergyCountFromLikes:
    @pytest.mark.parametrize(
        ("likes", "expected"),
        [
            (0, 0),
            (1, 1),
            (2, 2),
            (100, 7),
            (100000, 8),
        ],
    )
    def test_counts(self, likes, expected):
        assert energy_count_from_likes(likes) == expected

    def test_negative_likes_return_zero(self):
        assert energy_count_from_likes(-5) == 0


def _profile(models=None, datasets=None, spaces=None) -> HfProfileData:
    return HfProfileData(
        user=UserProfile(username="testuser", display_name="Test User"),
        models=models or [],
        datasets=datasets or [],
        spaces=spaces or [],
    )


class TestBuildCardEnergy:
    def test_energy_fields_match_type_and_likes(self):
        data = _profile(
            models=[
                RepoItem(id="testuser/vision-model", likes=50, tags=["vision"]),
                RepoItem(id="testuser/detector", likes=50, tags=["object-detection"]),
            ],
        )
        card = build_card(data)

        assert card.type == "Vision"
        assert card.energy_name == "Fire"
        assert card.energy_symbol == "🔥"
        assert card.energy_count == energy_count_from_likes(data.total_likes)
        assert card.energy_count == 7  # 100 total likes

    def test_energy_fields_consistent_with_mapping(self):
        data = _profile(
            models=[RepoItem(id="testuser/coder", likes=1, tags=["codegen"])],
        )
        card = build_card(data)

        expected = energy_for_type(card.type)
        assert card.energy_name == expected.name
        assert card.energy_symbol == expected.symbol
        assert card.energy_count == 1  # single like

    def test_no_likes_means_no_energy(self):
        card = build_card(_profile())
        assert card.energy_count == 0
        # Type is always one of the known types, so energy is never Colorless here
        assert card.energy_name == energy_for_type(card.type).name
