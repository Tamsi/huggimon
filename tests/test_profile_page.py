"""Tests for public profile pages at /{username}."""

import html

from src.binder_fetcher import BinderPage, FollowerMini
from src.profile_page import is_profile_username, render_profile_page
from src.scoring import CardData, CardStats


def _sample_card() -> CardData:
    return CardData(
        username="tamsi",
        display_name="Tamsi",
        level=42,
        type="Code",
        rarity="Rare",
        stats=CardStats(50, 40, 30, 60, 20, 70),
        attacks=["Fine-tune Blast"],
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
    )


def _sample_binder() -> BinderPage:
    return BinderPage(
        owner="tamsi",
        page=1,
        total_pages=2,
        total_followers=11,
        cards=[
            FollowerMini(
                username="ash",
                display_name="Ash",
                avatar_url=None,
                num_followers=5,
                num_models=1,
                num_datasets=0,
                num_spaces=0,
                level=9,
                stars=1,
                energy_count=2,
            )
        ],
    )


class TestIsProfileUsername:
    def test_valid_username(self):
        assert is_profile_username("ImTamsi")
        assert is_profile_username("julien-c")

    def test_reserved_paths_rejected(self):
        assert not is_profile_username("api")
        assert not is_profile_username("assets")
        assert not is_profile_username("card")

    def test_empty_rejected(self):
        assert not is_profile_username("")


class TestRenderProfilePage:
    def test_contains_card_and_share_url(self):
        doc = render_profile_page(
            _sample_card(),
            _sample_binder(),
            profile_url="https://huggimon.test/tamsi",
            card_png_url="https://huggimon.test/api/card/tamsi.png",
            app_url="https://huggimon.test/",
        )
        assert "Tamsi" in doc
        assert "@tamsi" in doc
        assert "https://huggimon.test/tamsi" in doc
        assert "Follower binder" in doc
        assert "hpk-card" in doc

    def test_escapes_display_name(self):
        card = _sample_card()
        card.display_name = "<script>alert(1)</script>"
        doc = render_profile_page(
            card,
            _sample_binder(),
            profile_url="https://huggimon.test/x",
            card_png_url="https://huggimon.test/api/card/x.png",
            app_url="https://huggimon.test/",
        )
        escaped = html.escape("<script>alert(1)</script>")
        assert escaped in doc
        assert f"<h1>{escaped}</h1>" in doc

    def test_pager_links_on_multi_page_binder(self):
        doc = render_profile_page(
            _sample_card(),
            _sample_binder(),
            profile_url="https://huggimon.test/tamsi",
            card_png_url="https://huggimon.test/api/card/tamsi.png",
            app_url="https://huggimon.test/",
        )
        assert 'href="https://huggimon.test/tamsi?page=2"' in doc
