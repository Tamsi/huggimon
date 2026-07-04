"""Fetch a user's followers and derive mini-card stats for the binder."""

import logging
import math
import time
from dataclasses import dataclass
from typing import List, Optional, Tuple

from huggingface_hub import HfApi
from huggingface_hub.utils import HfHubHTTPError

logger = logging.getLogger(__name__)

HF_BASE_URL = "https://huggingface.co"
FOLLOWERS_CACHE_TTL_SECONDS = 600.0

# Maps username -> (monotonic timestamp, raw followers list).
_followers_cache: dict[str, tuple[float, list]] = {}


@dataclass
class FollowerMini:
    username: str
    display_name: str
    avatar_url: Optional[str]
    num_followers: int
    num_models: int
    num_datasets: int
    num_spaces: int
    level: int
    stars: int
    energy_count: int


@dataclass
class BinderPage:
    owner: str
    page: int
    total_pages: int
    total_followers: int
    cards: List[FollowerMini]


def compute_mini_stats(
    num_followers: int, num_models: int, num_datasets: int, num_spaces: int
) -> Tuple[int, int, int]:
    """Derive (level, stars, energy_count) from a follower's raw counts."""
    mini_score = num_models * 4 + num_datasets * 4 + num_spaces * 6 + min(num_followers, 50)
    level = max(1, min(100, mini_score))
    if mini_score >= 90:
        stars = 4
    elif mini_score >= 60:
        stars = 3
    elif mini_score >= 30:
        stars = 2
    else:
        stars = 1
    energy_count = min(6, int(math.log2(num_followers + 1)))
    return level, stars, energy_count


def _normalize_avatar_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    if url.startswith("/"):
        return HF_BASE_URL + url
    return url


def _clear_cache() -> None:
    _followers_cache.clear()


def _get_followers(api: HfApi, username: str) -> list:
    now = time.monotonic()
    cached = _followers_cache.get(username)
    if cached is not None and now - cached[0] < FOLLOWERS_CACHE_TTL_SECONDS:
        return cached[1]

    try:
        followers = list(api.list_user_followers(username))
    except HfHubHTTPError as e:
        if e.response.status_code == 404:
            raise ValueError(f"User '{username}' not found on Hugging Face.") from e
        raise
    except Exception as e:
        logger.warning("Failed to fetch followers for %s: %s", username, e)
        raise ValueError(f"Could not fetch followers for '{username}'.") from e

    _followers_cache[username] = (now, followers)
    return followers


def _build_follower_mini(api: HfApi, follower) -> FollowerMini:
    username = getattr(follower, "username", "") or ""
    display_name = getattr(follower, "fullname", None) or username
    avatar_url = getattr(follower, "avatar_url", None)

    num_followers = num_models = num_datasets = num_spaces = 0
    try:
        overview = api.get_user_overview(username)
        num_followers = overview.num_followers or 0
        num_models = overview.num_models or 0
        num_datasets = overview.num_datasets or 0
        num_spaces = overview.num_spaces or 0
        display_name = overview.fullname or display_name
        avatar_url = overview.avatar_url or avatar_url
    except Exception as e:
        logger.warning("Failed to fetch overview for follower %s: %s", username, e)

    level, stars, energy_count = compute_mini_stats(
        num_followers, num_models, num_datasets, num_spaces
    )
    return FollowerMini(
        username=username,
        display_name=display_name,
        avatar_url=_normalize_avatar_url(avatar_url),
        num_followers=num_followers,
        num_models=num_models,
        num_datasets=num_datasets,
        num_spaces=num_spaces,
        level=level,
        stars=stars,
        energy_count=energy_count,
    )


def fetch_binder_page(username: str, page: int = 1, page_size: int = 9) -> BinderPage:
    username = username.strip().lstrip("@")
    if not username:
        raise ValueError("Username is required.")

    api = HfApi()
    followers = _get_followers(api, username)

    total_followers = len(followers)
    total_pages = max(1, math.ceil(total_followers / page_size))
    page = max(1, min(page, total_pages))

    start = (page - 1) * page_size
    cards = [
        _build_follower_mini(api, follower)
        for follower in followers[start : start + page_size]
    ]

    return BinderPage(
        owner=username,
        page=page,
        total_pages=total_pages,
        total_followers=total_followers,
        cards=cards,
    )
