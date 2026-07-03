"""Fetch public Hugging Face Hub data for a given username."""

import logging
from dataclasses import dataclass, field
from typing import List, Optional

from huggingface_hub import HfApi
from huggingface_hub.utils import HfHubHTTPError

logger = logging.getLogger(__name__)

MAX_ITEMS = 200


@dataclass
class UserProfile:
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    num_followers: int = 0
    num_following: int = 0
    num_discussions: int = 0
    is_pro: bool = False


@dataclass
class RepoItem:
    id: str
    likes: int = 0
    downloads: int = 0
    tags: List[str] = field(default_factory=list)
    description: Optional[str] = None
    pipeline_tag: Optional[str] = None


@dataclass
class HfProfileData:
    user: UserProfile
    models: List[RepoItem]
    datasets: List[RepoItem]
    spaces: List[RepoItem]

    @property
    def total_model_likes(self) -> int:
        return sum(m.likes for m in self.models)

    @property
    def total_model_downloads(self) -> int:
        return sum(m.downloads for m in self.models)

    @property
    def total_space_likes(self) -> int:
        return sum(s.likes for s in self.spaces)

    @property
    def total_likes(self) -> int:
        return self.total_model_likes + self.total_space_likes + sum(d.likes for d in self.datasets)

    @property
    def total_downloads(self) -> int:
        return self.total_model_downloads + sum(d.downloads for d in self.datasets)


def _get_user_profile(api: HfApi, username: str) -> UserProfile:
    try:
        overview = api.get_user_overview(username)
    except HfHubHTTPError as e:
        if e.response.status_code == 404:
            raise ValueError(f"User '{username}' not found on Hugging Face.") from e
        raise
    except Exception as e:
        logger.warning("Failed to fetch user overview for %s: %s", username, e)
        raise ValueError(f"Could not fetch profile for '{username}'.") from e

    return UserProfile(
        username=overview.username,
        display_name=overview.fullname or overview.username,
        avatar_url=overview.avatar_url,
        num_followers=overview.num_followers or 0,
        num_following=overview.num_following or 0,
        num_discussions=overview.num_discussions or 0,
        is_pro=overview.is_pro or False,
    )


def _repo_item_from_model(item) -> RepoItem:
    return RepoItem(
        id=getattr(item, "id", ""),
        likes=getattr(item, "likes", 0) or 0,
        downloads=getattr(item, "downloads", 0) or 0,
        tags=list(getattr(item, "tags", []) or []),
        description=getattr(item, "description", None) or None,
        pipeline_tag=getattr(item, "pipeline_tag", None) or None,
    )


def _repo_item_from_dataset(item) -> RepoItem:
    return RepoItem(
        id=getattr(item, "id", ""),
        likes=getattr(item, "likes", 0) or 0,
        downloads=getattr(item, "downloads", 0) or 0,
        tags=list(getattr(item, "tags", []) or []),
        description=getattr(item, "description", None) or None,
    )


def _repo_item_from_space(item) -> RepoItem:
    return RepoItem(
        id=getattr(item, "id", ""),
        likes=getattr(item, "likes", 0) or 0,
        downloads=0,
        tags=list(getattr(item, "tags", []) or []),
        description=getattr(item, "description", None) or None,
    )


def fetch_hf_profile(username: str) -> HfProfileData:
    username = username.strip().lstrip("@")
    if not username:
        raise ValueError("Username is required.")

    api = HfApi()
    user = _get_user_profile(api, username)

    try:
        models = [
            _repo_item_from_model(m)
            for m in api.list_models(author=username, limit=MAX_ITEMS)
        ]
    except Exception as e:
        logger.warning("Failed to fetch models for %s: %s", username, e)
        models = []

    try:
        datasets = [
            _repo_item_from_dataset(d)
            for d in api.list_datasets(author=username, limit=MAX_ITEMS)
        ]
    except Exception as e:
        logger.warning("Failed to fetch datasets for %s: %s", username, e)
        datasets = []

    try:
        spaces = [
            _repo_item_from_space(s)
            for s in api.list_spaces(author=username, limit=MAX_ITEMS)
        ]
    except Exception as e:
        logger.warning("Failed to fetch spaces for %s: %s", username, e)
        spaces = []

    return HfProfileData(user=user, models=models, datasets=datasets, spaces=spaces)
