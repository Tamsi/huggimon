"""Vendored pokemon-cards-css integration (https://github.com/simeydotme/pokemon-cards-css)."""

from __future__ import annotations

import json
import random

from src.card_variant import Variant

STATIC_PREFIX = "/static/vendor/pokemon-cards-css"

CARD_BACK_URL = (
    "https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg"
)

# Full stylesheet stack from pokemon-cards-css public/index.html.
_ALL_STYLESHEETS: tuple[str, ...] = (
    f"{STATIC_PREFIX}/css/cards/base.css",
    f"{STATIC_PREFIX}/css/cards.css",
    f"{STATIC_PREFIX}/css/cards/basic.css",
    f"{STATIC_PREFIX}/css/cards/reverse-holo.css",
    f"{STATIC_PREFIX}/css/cards/regular-holo.css",
    f"{STATIC_PREFIX}/css/cards/cosmos-holo.css",
    f"{STATIC_PREFIX}/css/cards/amazing-rare.css",
    f"{STATIC_PREFIX}/css/cards/radiant-holo.css",
    f"{STATIC_PREFIX}/css/cards/trainer-gallery-holo.css",
    f"{STATIC_PREFIX}/css/cards/v-regular.css",
    f"{STATIC_PREFIX}/css/cards/v-full-art.css",
    f"{STATIC_PREFIX}/css/cards/v-max.css",
    f"{STATIC_PREFIX}/css/cards/v-star.css",
    f"{STATIC_PREFIX}/css/cards/trainer-full-art.css",
    f"{STATIC_PREFIX}/css/cards/trainer-gallery-v-regular.css",
    f"{STATIC_PREFIX}/css/cards/trainer-gallery-v-max.css",
    f"{STATIC_PREFIX}/css/cards/rainbow-holo.css",
    f"{STATIC_PREFIX}/css/cards/rainbow-alt.css",
    f"{STATIC_PREFIX}/css/cards/secret-rare.css",
    f"{STATIC_PREFIX}/css/cards/trainer-gallery-secret-rare.css",
    f"{STATIC_PREFIX}/css/cards/shiny-rare.css",
    f"{STATIC_PREFIX}/css/cards/shiny-v.css",
    f"{STATIC_PREFIX}/css/cards/shiny-vmax.css",
    f"{STATIC_PREFIX}/css/cards/swsh-pikachu.css",
    f"{STATIC_PREFIX}/css/huggimon-overrides.css",
)

_ENERGY_TYPE_CLASS: dict[str, str] = {
    "Fire": "fire",
    "Water": "water",
    "Lightning": "lightning",
    "Grass": "grass",
    "Psychic": "psychic",
    "Metal": "metal",
    "Rainbow": "fairy",
    "Colorless": "colorless",
}


def tcg_rarity_for_variant(variant: Variant) -> str:
    """Wire-format data-rarity value for pokemon-cards-css."""
    return variant.data_rarity


def energy_type_class(energy_name: str) -> str:
    return _ENERGY_TYPE_CLASS.get(energy_name, "colorless")


def stage_subtype(stage: str) -> str:
    if stage == "Stage 1":
        return "stage1"
    if stage == "Stage 2":
        return "stage2"
    return "basic"


def card_seed_style(seed: str) -> str:
    rng = random.Random(seed)
    sx, sy = rng.random(), rng.random()
    return (
        f"--seedx:{sx:.6f};--seedy:{sy:.6f};"
        f"--cosmosbg:{int(sx * 734)}px {int(sy * 1280)}px;"
    )


def render_stylesheet_links() -> str:
    return "".join(
        f'<link rel="stylesheet" href="{href}"/>' for href in _ALL_STYLESHEETS
    )


def _js_string_for_script_tag(value: str) -> str:
    return json.dumps(value).replace("</", "<\\/")


_INTERACT_SCRIPT = """
(function () {
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  function round(n) { return Math.round(n); }
  function adjust(v, fmin, fmax, tmin, tmax) {
    return tmin + ((tmax - tmin) * (v - fmin)) / (fmax - fmin);
  }

  function isHolo(card) {
    var r = (card.getAttribute("data-rarity") || "common").toLowerCase();
    return r !== "common";
  }

  var IDLE_X = 62;
  var IDLE_Y = 38;

  function idleOpacity(card) {
    return isHolo(card) ? "0.72" : "0";
  }

  function applyVars(card, px, py, rotX, rotY, opacity) {
    var centerX = px - 50;
    var centerY = py - 50;
    var fromCenter = clamp(Math.sqrt(centerX * centerX + centerY * centerY) / 50, 0, 1);
    card.style.setProperty("--pointer-x", px + "%");
    card.style.setProperty("--pointer-y", py + "%");
    card.style.setProperty("--pointer-from-center", String(Math.max(fromCenter, 0.35)));
    card.style.setProperty("--pointer-from-top", py / 100);
    card.style.setProperty("--pointer-from-left", px / 100);
    card.style.setProperty("--background-x", adjust(px, 0, 100, 37, 63) + "%");
    card.style.setProperty("--background-y", adjust(py, 0, 100, 33, 67) + "%");
    card.style.setProperty("--rotate-x", rotX + "deg");
    card.style.setProperty("--rotate-y", rotY + "deg");
    card.style.setProperty("--card-opacity", String(opacity));
    card.style.setProperty("--card-scale", "1");
    card.style.setProperty("--translate-x", "0px");
    card.style.setProperty("--translate-y", "0px");
  }

  function runShowcase(card) {
    if (!isHolo(card)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyVars(card, IDLE_X, IDLE_Y, 0, 0, idleOpacity(card));
      return;
    }

    var start = performance.now();
    var duration = 4200;

    function frame(now) {
      var t = (now - start) / duration;
      if (t >= 1) {
        applyVars(card, IDLE_X, IDLE_Y, 0, 0, idleOpacity(card));
        card.classList.remove("interacting");
        return;
      }
      var r = t * Math.PI * 2.4;
      var px = 50 + Math.sin(r) * 38;
      var py = 50 + Math.cos(r * 0.9) * 32;
      applyVars(
        card,
        px,
        py,
        round(Math.sin(r) * 14),
        round(Math.cos(r) * 12),
        0.85
      );
      card.classList.add("interacting");
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  document.querySelectorAll(".card.hpk-tcg.interactive").forEach(function (card) {
    if (card.hasAttribute("data-hpk-bound")) return;
    card.setAttribute("data-hpk-bound", "1");

    var rotator = card.querySelector(".card__rotator");
    if (!rotator) return;

    setTimeout(function () { runShowcase(card); }, 400);

    function interact(e) {
      if (e.type === "touchmove" && e.touches && e.touches[0]) {
        e.clientX = e.touches[0].clientX;
        e.clientY = e.touches[0].clientY;
      }
      var rect = rotator.getBoundingClientRect();
      var px = clamp(round((100 / rect.width) * (e.clientX - rect.left)), 0, 100);
      var py = clamp(round((100 / rect.height) * (e.clientY - rect.top)), 0, 100);
      var centerX = px - 50;
      var centerY = py - 50;
      applyVars(
        card,
        px,
        py,
        round(-(centerX / 3.5)),
        round(centerY / 3.5),
        1
      );
      card.classList.add("interacting");
    }

    function interactEnd() {
      card.classList.remove("interacting");
      applyVars(card, IDLE_X, IDLE_Y, 0, 0, idleOpacity(card));
    }

    rotator.addEventListener("pointermove", interact);
    rotator.addEventListener("pointerleave", interactEnd);
    rotator.addEventListener("blur", interactEnd);

    applyVars(card, IDLE_X, IDLE_Y, 0, 0, idleOpacity(card));
  });
})();
"""


def render_interact_script() -> str:
    return f"<script>{_INTERACT_SCRIPT}</script>"
