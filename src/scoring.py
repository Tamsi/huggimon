"""Compute HuggiMon card stats, type, rarity and moves from HF profile data."""

import math
from dataclasses import dataclass
from typing import List, Optional, Tuple

from src.energy import energy_count_from_likes, energy_for_type
from src.hf_fetcher import HfProfileData


MAX_STAT = 100

TYPE_TAGS = {
    "Code": ["code", "codegen", "programming", "codet5", "codebert", "starcoder"],
    "Vision": ["vision", "image-classification", "object-detection", "diffusers", "image-to-text", "text-to-image"],
    "Audio": ["audio", "speech", "automatic-speech-recognition", "text-to-speech", "voice-activity-detection"],
    "NLP": ["nlp", "text-classification", "token-classification", "question-answering", "summarization", "translation"],
    "Multimodal": ["multimodal", "image-to-text", "text-to-image", "visual-question-answering"],
    "Agent": ["agent", "smolagents", "tool", "autonomous", "grpo"],
    "Dataset": [],
}


@dataclass
class CardStats:
    model: int
    data: int
    space: int
    impact: int
    community: int
    docs: int

    @property
    def overall(self) -> int:
        return int(
            round(
                (self.model + self.data + self.space + self.impact + self.community + self.docs) / 6
            )
        )


@dataclass
class CardData:
    username: str
    display_name: str
    level: int
    type: str
    rarity: str
    stats: CardStats
    attacks: List[str]
    passive: str
    evolution: str
    total_models: int
    total_datasets: int
    total_spaces: int
    total_followers: int
    total_downloads: int
    total_likes: int
    energy_name: str = "Colorless"
    energy_symbol: str = "✦"
    energy_count: int = 0
    avatar_url: Optional[str] = None


def _normalize_avatar_url(url: Optional[str]) -> Optional[str]:
    # Same rule as src.binder_fetcher: HF returns relative avatar paths for defaults.
    if url and url.startswith("/"):
        return "https://huggingface.co" + url
    return url


def _clamp(value: float) -> int:
    return max(0, min(MAX_STAT, int(round(value))))


def _score_model(data: HfProfileData) -> int:
    models = len(data.models)
    likes = data.total_model_likes
    downloads = data.total_model_downloads
    score = models * 4 + math.log1p(likes) * 5 + math.log1p(downloads) * 1.5
    return _clamp(score)


def _score_data(data: HfProfileData) -> int:
    datasets = len(data.datasets)
    likes = sum(d.likes for d in data.datasets)
    downloads = sum(d.downloads for d in data.datasets)
    score = datasets * 8 + math.log1p(likes) * 3 + math.log1p(downloads) * 1.2
    return _clamp(score)


def _score_space(data: HfProfileData) -> int:
    spaces = len(data.spaces)
    likes = data.total_space_likes
    score = spaces * 9 + math.log1p(likes) * 6
    return _clamp(score)


def _score_impact(data: HfProfileData) -> int:
    likes = data.total_likes
    downloads = data.total_downloads
    score = math.log1p(likes) * 8 + math.log1p(downloads) * 2.5
    return _clamp(score)


def _score_community(data: HfProfileData) -> int:
    followers = data.user.num_followers
    discussions = data.user.num_discussions
    score = followers * 0.8 + discussions * 2 + math.log1p(followers) * 5
    return _clamp(score)


def _score_docs(data: HfProfileData) -> int:
    all_repos = data.models + data.datasets + data.spaces
    if not all_repos:
        return 0
    with_description = sum(1 for r in all_repos if r.description)
    score = (with_description / len(all_repos)) * 80 + math.log1p(len(all_repos)) * 5
    return _clamp(score)


def compute_stats(data: HfProfileData) -> CardStats:
    return CardStats(
        model=_score_model(data),
        data=_score_data(data),
        space=_score_space(data),
        impact=_score_impact(data),
        community=_score_community(data),
        docs=_score_docs(data),
    )


def _detect_type(data: HfProfileData, stats: CardStats) -> str:
    tag_counts: dict[str, int] = {t: 0 for t in TYPE_TAGS}
    for repo in data.models + data.datasets + data.spaces:
        for tag in repo.tags:
            lower = tag.lower()
            for t, keywords in TYPE_TAGS.items():
                if any(k in lower for k in keywords):
                    tag_counts[t] += 1

    if len(data.datasets) > len(data.models) + len(data.spaces) and stats.data >= stats.model:
        return "Dataset"

    best = max(tag_counts, key=tag_counts.get)
    if tag_counts[best] > 0:
        return best
    return "Code" if stats.model >= stats.data else "NLP"


def _rarity_from_overall(overall: int) -> str:
    if overall >= 90:
        return "Legendary"
    if overall >= 75:
        return "Epic"
    if overall >= 55:
        return "Rare"
    return "Common"


def _level(overall: int) -> int:
    return max(1, int(overall * 1.2))


def _moves(type_name: str, stats: CardStats) -> Tuple[List[str], str, str]:
    attacks = []
    if stats.model >= 70:
        attacks.append("Model Overload")
    elif stats.model >= 40:
        attacks.append("Fine-tune Blast")
    else:
        attacks.append("Tiny Tune")

    if stats.data >= 70:
        attacks.append("Dataset Tsunami")
    elif stats.data >= 40:
        attacks.append("Dataset Drop")
    else:
        attacks.append("Data Sample")

    if stats.space >= 70:
        attacks.append("Space Storm")
    elif stats.space >= 40:
        attacks.append("Space Builder")
    else:
        attacks.append("Space Launch")

    if stats.impact >= 80:
        attacks.append("Viral Release")

    # Trim to 2 best attacks by stat priority
    priority = sorted(
        [("Model Overload", stats.model), ("Dataset Tsunami", stats.data), ("Space Storm", stats.space)],
        key=lambda x: x[1],
        reverse=True,
    )[:2]
    attacks = [a for a, _ in priority]

    passive_map = {
        "Code": "Open Source Aura",
        "Vision": "Pixel Precision",
        "Audio": "Wave Resonance",
        "NLP": "Token Mastery",
        "Multimodal": "Fusion Core",
        "Agent": "Toolformer Soul",
        "Dataset": "Data Curator",
    }
    passive = passive_map.get(type_name, "Hub Spirit")

    if stats.overall >= 90:
        evolution = "Contributor → Builder → Hub Legend"
    elif stats.overall >= 75:
        evolution = "Contributor → Builder → Architect"
    elif stats.overall >= 55:
        evolution = "Contributor → Builder"
    else:
        evolution = "Contributor"

    return attacks, passive, evolution


def build_card(data: HfProfileData) -> CardData:
    stats = compute_stats(data)
    overall = stats.overall
    type_name = _detect_type(data, stats)
    rarity = _rarity_from_overall(overall)
    level = _level(overall)
    attacks, passive, evolution = _moves(type_name, stats)
    energy = energy_for_type(type_name)

    return CardData(
        username=data.user.username,
        display_name=data.user.display_name or data.user.username,
        level=level,
        type=type_name,
        rarity=rarity,
        stats=stats,
        attacks=attacks,
        passive=passive,
        evolution=evolution,
        total_models=len(data.models),
        total_datasets=len(data.datasets),
        total_spaces=len(data.spaces),
        total_followers=data.user.num_followers,
        total_downloads=data.total_downloads,
        total_likes=data.total_likes,
        energy_name=energy.name,
        energy_symbol=energy.symbol,
        energy_count=energy_count_from_likes(data.total_likes),
        avatar_url=_normalize_avatar_url(data.user.avatar_url),
    )
