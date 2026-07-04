"""Generate the HTML binder page (3x3 follower mini-cards) for the Gradio UI."""

import html

from src.binder_fetcher import BinderPage, FollowerMini

BINDER_THEME = {
    "bg": "#1c1917",
    "pocket": "#292524",
    "border": "#44403c",
    "text": "#fafaf9",
    "subtext": "#a8a29e",
    "accent": "#fbbf24",
}

POCKETS_PER_PAGE = 9

EMPTY_SLEEVE_CLASS = "binder-empty-sleeve"


def _avatar_html(card: FollowerMini) -> str:
    if card.avatar_url:
        return (
            f'<img src="{html.escape(card.avatar_url, quote=True)}" '
            f'alt="" width="48" height="48" '
            f'style="width:48px;height:48px;border-radius:50%;object-fit:cover;'
            f'border:2px solid {BINDER_THEME["border"]};"/>'
        )
    initial = html.escape(card.username[:1].upper() or "?")
    return (
        f'<div style="width:48px;height:48px;border-radius:50%;'
        f'display:flex;align-items:center;justify-content:center;'
        f'background:{BINDER_THEME["border"]};color:{BINDER_THEME["text"]};'
        f'font-size:20px;font-weight:800;">{initial}</div>'
    )


def _filled_pocket(card: FollowerMini) -> str:
    display_name = html.escape(card.display_name)
    username = html.escape(card.username)
    stars = "★" * card.stars
    energy = "✦" * card.energy_count if card.energy_count > 0 else "–"

    return f"""
    <div style="
      background:{BINDER_THEME['pocket']};
      border:1px solid {BINDER_THEME['border']};
      border-radius:12px;
      padding:10px;
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:4px;
      text-align:center;
      min-width:0;
    ">
      {_avatar_html(card)}
      <div style="max-width:100%;font-size:13px;font-weight:800;color:{BINDER_THEME['text']};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{display_name}</div>
      <div style="max-width:100%;font-size:11px;color:{BINDER_THEME['subtext']};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">@{username}</div>
      <div style="display:flex;gap:8px;align-items:center;font-size:11px;">
        <span style="font-weight:800;color:{BINDER_THEME['text']};">LV {card.level}</span>
        <span style="color:{BINDER_THEME['accent']};">{stars}</span>
      </div>
      <div style="font-size:11px;letter-spacing:2px;color:{BINDER_THEME['accent']};">{energy}</div>
    </div>
    """


def _empty_sleeve() -> str:
    return f"""
    <div class="{EMPTY_SLEEVE_CLASS}" style="
      border:2px dashed {BINDER_THEME['border']};
      border-radius:12px;
      padding:10px;
      min-height:130px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:11px;
      color:{BINDER_THEME['subtext']};
      opacity:0.6;
    ">empty</div>
    """


def render_binder_html(binder: BinderPage) -> str:
    owner = html.escape(binder.owner)
    pockets = [_filled_pocket(card) for card in binder.cards[:POCKETS_PER_PAGE]]
    pockets += [_empty_sleeve()] * (POCKETS_PER_PAGE - len(pockets))
    pockets_html = "".join(pockets)

    return f"""
    <div class="hbinder" style="
      width:520px;
      border-radius:24px;
      padding:22px;
      background:{BINDER_THEME['bg']};
      border:1px solid {BINDER_THEME['border']};
      box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);
      font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
      color:{BINDER_THEME['text']};
    ">
      <div style="border:1px solid {BINDER_THEME['border']};border-radius:16px;padding:16px;">
        <div style="margin-bottom:14px;">
          <div style="font-size:18px;font-weight:800;">🗂 {owner}'s Binder</div>
          <div style="font-size:12px;color:{BINDER_THEME['subtext']};margin-top:2px;">
            {binder.total_followers} trainers collected · page {binder.page}/{binder.total_pages}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;">
          {pockets_html}
        </div>
      </div>
    </div>
    """
