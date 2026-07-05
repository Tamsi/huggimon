#!/usr/bin/env python3
"""Smoke-test holo tier wiring against real Hugging Face profiles."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.card_variant import variant_for_level
from src.hf_fetcher import fetch_hf_profile
from src.pokecard_html import render_pokecard_html
from src.pokemon_card_css import render_stylesheet_links
from src.scoring import build_card

# Profiles spanning low → top tiers (usernames may change; script tolerates failures).
SAMPLES = [
    "hf-internal-testing",
    "sgugger",
    "lysandre",
    "pcuenq",
    "reach-vb",
    "yoshitomo-matsubara",
    "yuvraj Sharma",
    "ImTamsi",
]


def _check_html(card, html: str) -> list[str]:
    variant = variant_for_level(card.level)
    issues: list[str] = []

    if variant.data_rarity not in html:
        issues.append(f"missing data-rarity={variant.data_rarity!r}")
    if f'class="card interactive hpk-tcg' not in html:
        issues.append("missing card root class")
    if "card__shine" not in html:
        issues.append("missing shine layer")
    if "huggimon-overrides.css" not in html:
        issues.append("missing overrides stylesheet")

    stylesheets = render_stylesheet_links()
    for sheet in ("regular-holo.css", "v-star.css", "rainbow-holo.css", "secret-rare.css"):
        if sheet not in stylesheets:
            issues.append(f"missing stylesheet link {sheet}")

    if variant.masked and " masked" not in html:
        issues.append("expected masked class")

    return issues


def main() -> int:
    print("HuggiMon holo tier diagnostics\n" + "=" * 40)
    failures = 0

    for raw in SAMPLES:
        username = raw.strip().lstrip("@").replace(" ", "")
        try:
            profile = fetch_hf_profile(username)
            card = build_card(profile)
            variant = variant_for_level(card.level)
            html = render_pokecard_html(
                card, face_url=f"/api/card/{card.username}/face.png"
            )
            issues = _check_html(card, html)
            status = "OK" if not issues else "FAIL"
            if issues:
                failures += 1
            print(
                f"[{status}] @{card.username:<22} "
                f"lv={card.level:<3} → {variant.name:<16} "
                f"rarity={variant.data_rarity}"
            )
            for issue in issues:
                print(f"         · {issue}")
        except Exception as exc:
            failures += 1
            print(f"[SKIP] @{username:<22} {exc}")

    print("=" * 40)
    print(f"Done — {failures} issue(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
