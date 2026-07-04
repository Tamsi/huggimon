"""Unit tests for the follower binder fetcher and HTML renderer."""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from src.binder_fetcher import (
    BinderPage,
    FollowerMini,
    _clear_cache,
    compute_mini_stats,
    fetch_binder_page,
)
from src.binder_html import EMPTY_SLEEVE_CLASS, render_binder_html


@pytest.fixture(autouse=True)
def clear_followers_cache():
    _clear_cache()
    yield
    _clear_cache()


def _fake_follower(index: int) -> SimpleNamespace:
    return SimpleNamespace(
        username=f"follower{index}",
        fullname=f"Follower {index}",
        avatar_url=f"/avatars/{index}.svg",
    )


def _fake_overview(username: str, followers=10, models=1, datasets=1, spaces=1):
    return SimpleNamespace(
        username=username,
        fullname=f"Full {username}",
        avatar_url=f"https://cdn.example.com/{username}.png",
        num_followers=followers,
        num_models=models,
        num_datasets=datasets,
        num_spaces=spaces,
    )


def _mock_api(followers, overview_side_effect=None):
    api = MagicMock()
    api.list_user_followers.return_value = followers
    if overview_side_effect is not None:
        api.get_user_overview.side_effect = overview_side_effect
    else:
        api.get_user_overview.side_effect = lambda u: _fake_overview(u)
    return api


class TestComputeMiniStats:
    @pytest.mark.parametrize(
        ("followers", "models", "datasets", "spaces", "level", "stars", "energy"),
        [
            (0, 0, 0, 0, 1, 1, 0),
            (1, 0, 0, 0, 1, 1, 1),
            (63, 0, 0, 0, 50, 2, 6),
            (1000, 0, 0, 0, 50, 2, 6),  # followers capped at 50, energy capped at 6
            (0, 5, 0, 0, 20, 1, 0),
            (0, 0, 0, 5, 30, 2, 0),  # mini_score exactly 30 -> 2 stars
            (0, 15, 0, 0, 60, 3, 0),  # mini_score exactly 60 -> 3 stars
            (0, 0, 0, 15, 90, 4, 0),  # mini_score exactly 90 -> 4 stars
            (50, 20, 10, 10, 100, 4, 5),  # 230 raw -> level capped at 100
        ],
    )
    def test_known_inputs(self, followers, models, datasets, spaces, level, stars, energy):
        assert compute_mini_stats(followers, models, datasets, spaces) == (level, stars, energy)


class TestFetchBinderPage:
    def test_empty_username_raises(self):
        with pytest.raises(ValueError, match="Username is required."):
            fetch_binder_page("  @ ")

    @patch("src.binder_fetcher.HfApi")
    def test_pagination_total_pages(self, mock_api_cls):
        mock_api_cls.return_value = _mock_api([_fake_follower(i) for i in range(20)])

        binder = fetch_binder_page("owner", page=1)
        assert binder.total_pages == 3
        assert binder.total_followers == 20
        assert len(binder.cards) == 9

    @patch("src.binder_fetcher.HfApi")
    def test_pagination_last_page_partial(self, mock_api_cls):
        mock_api_cls.return_value = _mock_api([_fake_follower(i) for i in range(20)])

        binder = fetch_binder_page("owner", page=3)
        assert len(binder.cards) == 2
        assert binder.cards[0].username == "follower18"

    @patch("src.binder_fetcher.HfApi")
    def test_page_zero_clamps_to_one(self, mock_api_cls):
        mock_api_cls.return_value = _mock_api([_fake_follower(i) for i in range(20)])

        binder = fetch_binder_page("owner", page=0)
        assert binder.page == 1
        assert binder.cards[0].username == "follower0"

    @patch("src.binder_fetcher.HfApi")
    def test_page_overflow_clamps_to_last(self, mock_api_cls):
        mock_api_cls.return_value = _mock_api([_fake_follower(i) for i in range(20)])

        binder = fetch_binder_page("owner", page=99)
        assert binder.page == 3
        assert len(binder.cards) == 2

    @patch("src.binder_fetcher.HfApi")
    def test_no_followers_gives_one_empty_page(self, mock_api_cls):
        mock_api_cls.return_value = _mock_api([])

        binder = fetch_binder_page("owner")
        assert binder.total_pages == 1
        assert binder.page == 1
        assert binder.cards == []

    @patch("src.binder_fetcher.HfApi")
    def test_enrichment_failure_falls_back_to_zeros(self, mock_api_cls):
        followers = [_fake_follower(i) for i in range(3)]

        def overview(username):
            if username == "follower1":
                raise RuntimeError("boom")
            return _fake_overview(username)

        mock_api_cls.return_value = _mock_api(followers, overview_side_effect=overview)

        binder = fetch_binder_page("owner")
        assert len(binder.cards) == 3

        failed = binder.cards[1]
        assert failed.username == "follower1"
        assert failed.num_followers == 0
        assert failed.num_models == 0
        assert failed.num_datasets == 0
        assert failed.num_spaces == 0
        assert failed.level == 1
        assert failed.stars == 1
        assert failed.energy_count == 0
        # Falls back to listing display data.
        assert failed.display_name == "Follower 1"
        assert failed.avatar_url == "https://huggingface.co/avatars/1.svg"

    @patch("src.binder_fetcher.HfApi")
    def test_overview_none_counts_treated_as_zero(self, mock_api_cls):
        overview = SimpleNamespace(
            username="follower0",
            fullname=None,
            avatar_url=None,
            num_followers=None,
            num_models=None,
            num_datasets=None,
            num_spaces=None,
        )
        mock_api_cls.return_value = _mock_api(
            [_fake_follower(0)], overview_side_effect=lambda u: overview
        )

        card = fetch_binder_page("owner").cards[0]
        assert card.num_followers == 0
        assert card.level == 1
        # Listing fallbacks are kept when the overview has no data.
        assert card.display_name == "Follower 0"
        assert card.avatar_url == "https://huggingface.co/avatars/0.svg"

    @patch("src.binder_fetcher.HfApi")
    def test_absolute_avatar_url_kept_as_is(self, mock_api_cls):
        mock_api_cls.return_value = _mock_api([_fake_follower(0)])

        card = fetch_binder_page("owner").cards[0]
        assert card.avatar_url == "https://cdn.example.com/follower0.png"

    @patch("src.binder_fetcher.HfApi")
    def test_cache_prevents_second_followers_call(self, mock_api_cls):
        api = _mock_api([_fake_follower(i) for i in range(2)])
        mock_api_cls.return_value = api

        fetch_binder_page("owner", page=1)
        fetch_binder_page("owner", page=1)
        assert api.list_user_followers.call_count == 1

    @patch("src.binder_fetcher.HfApi")
    def test_cache_is_per_username(self, mock_api_cls):
        api = _mock_api([_fake_follower(0)])
        mock_api_cls.return_value = api

        fetch_binder_page("owner1")
        fetch_binder_page("owner2")
        assert api.list_user_followers.call_count == 2

    @patch("src.binder_fetcher.HfApi")
    def test_unknown_user_raises_value_error(self, mock_api_cls):
        from huggingface_hub.utils import HfHubHTTPError

        error = HfHubHTTPError("404 Client Error", response=MagicMock(status_code=404))
        api = MagicMock()
        api.list_user_followers.side_effect = error
        mock_api_cls.return_value = api

        with pytest.raises(ValueError, match="User 'ghost' not found on Hugging Face."):
            fetch_binder_page("ghost")


def _mini(username="ash", display_name="Ash Ketchum", avatar_url=None, **kwargs):
    defaults = dict(
        num_followers=10,
        num_models=2,
        num_datasets=1,
        num_spaces=1,
        level=28,
        stars=1,
        energy_count=3,
    )
    defaults.update(kwargs)
    return FollowerMini(
        username=username, display_name=display_name, avatar_url=avatar_url, **defaults
    )


class TestRenderBinderHtml:
    def test_two_followers_and_seven_empty_sleeves(self):
        binder = BinderPage(
            owner="prof-oak",
            page=1,
            total_pages=1,
            total_followers=2,
            cards=[_mini(username="ash"), _mini(username="misty", display_name="Misty")],
        )
        out = render_binder_html(binder)

        assert "@ash" in out
        assert "@misty" in out
        assert "prof-oak's Binder" in out
        assert "2 trainers collected · page 1/1" in out
        assert out.count(EMPTY_SLEEVE_CLASS) == 7

    def test_display_name_is_escaped(self):
        binder = BinderPage(
            owner="prof-oak",
            page=1,
            total_pages=1,
            total_followers=1,
            cards=[_mini(display_name="<script>alert(1)</script>")],
        )
        out = render_binder_html(binder)

        assert "<script>" not in out
        assert "&lt;script&gt;alert(1)&lt;/script&gt;" in out

    def test_avatar_fallback_uses_initial(self):
        binder = BinderPage(
            owner="prof-oak",
            page=1,
            total_pages=1,
            total_followers=1,
            cards=[_mini(username="ash", avatar_url=None)],
        )
        out = render_binder_html(binder)
        assert "<img" not in out
        assert ">A</div>" in out

    def test_avatar_image_rendered_when_url_present(self):
        binder = BinderPage(
            owner="prof-oak",
            page=1,
            total_pages=1,
            total_followers=1,
            cards=[_mini(avatar_url="https://huggingface.co/avatars/1.svg")],
        )
        out = render_binder_html(binder)
        assert 'src="https://huggingface.co/avatars/1.svg"' in out
        assert 'class="hpkm-avatar"' in out

    def test_stats_glyphs(self):
        binder = BinderPage(
            owner="prof-oak",
            page=1,
            total_pages=1,
            total_followers=1,
            cards=[_mini(level=42, stars=3, energy_count=2)],
        )
        out = render_binder_html(binder)
        assert "LV 42" in out
        assert "★★★" in out
        assert "✦✦" in out

    def test_zero_energy_shows_dash(self):
        binder = BinderPage(
            owner="prof-oak",
            page=1,
            total_pages=1,
            total_followers=1,
            cards=[_mini(energy_count=0)],
        )
        out = render_binder_html(binder)
        assert "✦" not in out
        assert "–" in out

    def test_level_90_gets_shiny_variant_with_holo_overlay(self):
        binder = BinderPage(
            owner="prof-oak",
            page=1,
            total_pages=1,
            total_followers=1,
            cards=[_mini(level=90)],
        )
        out = render_binder_html(binder)
        assert "hpk-v-shiny" in out
        assert "hpkm-holo" in out

    def test_level_10_has_no_holo_overlay(self):
        binder = BinderPage(
            owner="prof-oak",
            page=1,
            total_pages=1,
            total_followers=1,
            cards=[_mini(level=10)],
        )
        out = render_binder_html(binder)
        assert "hpk-v-standard" in out
        # Neither the overlay markup nor the conditional holo CSS chunk.
        assert "hpkm-holo" not in out
        assert "hpkm-sparkles" not in out

    def test_level_50_gets_ex_badge(self):
        binder = BinderPage(
            owner="prof-oak",
            page=1,
            total_pages=1,
            total_followers=1,
            cards=[_mini(level=50)],
        )
        out = render_binder_html(binder)
        assert "hpk-v-ex" in out
        assert '<span class="hpkm-badge">ex</span>' in out

    def test_display_name_escaped_in_mini_card_markup(self):
        binder = BinderPage(
            owner="prof-oak",
            page=1,
            total_pages=1,
            total_followers=1,
            cards=[_mini(display_name='<img src=x onerror="alert(1)">')],
        )
        out = render_binder_html(binder)
        assert "<img src=x" not in out
        assert "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;" in out
