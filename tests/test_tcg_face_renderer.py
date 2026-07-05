"""Tests for the TCG face PNG renderer."""

from io import BytesIO

from PIL import Image

from src.scoring import CardData, CardStats
from src.tcg_face_renderer import FACE_H, FACE_W, render_tcg_face_png


def _card(**kwargs) -> CardData:
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
    defaults.update(kwargs)
    return CardData(**defaults)


class TestTcgFacePng:
    def test_dimensions_match_pokemon_cards_css(self):
        data = render_tcg_face_png(_card())
        img = Image.open(BytesIO(data))
        assert img.size == (FACE_W, FACE_H)

    def test_returns_valid_png(self):
        data = render_tcg_face_png(_card())
        assert data[:8] == b"\x89PNG\r\n\x1a\n"
