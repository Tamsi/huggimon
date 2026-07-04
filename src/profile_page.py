"""Full profile page at /{username} — GitFut-style public trainer page."""

import html

from src.binder_fetcher import BinderPage
from src.binder_html import render_binder_html
from src.pokecard_html import render_pokecard_html
from src.scoring import CardData

RESERVED_USERNAMES = frozenset(
    {
        "api",
        "assets",
        "card",
        "config",
        "file",
        "gradio_api",
        "info",
        "login",
        "logout",
        "manifest.json",
        "queue",
        "ssr",
        "theme.css",
        "upload",
        "favicon.ico",
        "robots.txt",
        "sitemap.xml",
    }
)


def is_profile_username(segment: str) -> bool:
    """True if this path segment should be treated as a HF username profile."""
    if not segment or segment.startswith("."):
        return False
    return segment.lower() not in RESERVED_USERNAMES


def render_profile_page(
    card: CardData,
    binder: BinderPage,
    *,
    profile_url: str,
    card_png_url: str,
    app_url: str,
    style: str = "Starter",
) -> str:
    """Return a complete HTML document for a public trainer profile."""
    # `style` is kept for URL compatibility (?style=) but the animated pokecard
    # has a single look, so it is silently ignored here.
    card_fragment = render_pokecard_html(card)
    binder_fragment = render_binder_html(binder)

    display_name = html.escape(card.display_name)
    username = html.escape(card.username)
    profile_url_escaped = html.escape(profile_url, quote=True)
    card_png_escaped = html.escape(card_png_url, quote=True)
    app_url_escaped = html.escape(app_url, quote=True)

    prev_link = ""
    next_link = ""
    if binder.total_pages > 1:
        base = profile_url.split("?")[0]
        if binder.page > 1:
            prev_href = html.escape(f"{base}?page={binder.page - 1}", quote=True)
            prev_link = f'<a class="pager-btn" href="{prev_href}">◀ Prev</a>'
        if binder.page < binder.total_pages:
            next_href = html.escape(f"{base}?page={binder.page + 1}", quote=True)
            next_link = f'<a class="pager-btn" href="{next_href}">Next ▶</a>'

    og_title = html.escape(f"{card.display_name} — HuggiMon Trainer Card")
    og_desc = html.escape(
        f"Level {card.level} {card.type} trainer · {card.rarity} · "
        f"{card.total_likes} likes · {card.total_followers} followers"
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{og_title}</title>
  <meta name="description" content="{og_desc}">
  <meta property="og:title" content="{og_title}">
  <meta property="og:description" content="{og_desc}">
  <meta property="og:image" content="{card_png_escaped}">
  <meta property="og:url" content="{profile_url_escaped}">
  <meta name="twitter:card" content="summary_large_image">
  <style>
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0c0a09;
      color: #fafaf9;
      min-height: 100vh;
    }}
    .topbar {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid #292524;
      background: #1c1917;
    }}
    .brand {{ font-weight: 800; font-size: 18px; letter-spacing: -0.02em; }}
    .brand span {{ color: #a78bfa; }}
    .topbar a {{
      color: #a8a29e;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
    }}
    .topbar a:hover {{ color: #fafaf9; }}
    .hero {{
      text-align: center;
      padding: 40px 20px 24px;
    }}
    .hero h1 {{
      margin: 0 0 8px;
      font-size: clamp(28px, 5vw, 42px);
      font-weight: 900;
      letter-spacing: -0.03em;
    }}
    .hero .handle {{ color: #a8a29e; font-size: 16px; font-weight: 600; }}
    .hero .badges {{
      margin-top: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }}
    .badge {{
      background: #292524;
      border: 1px solid #44403c;
      border-radius: 999px;
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 700;
      color: #fbbf24;
    }}
    .layout {{
      max-width: 960px;
      margin: 0 auto;
      padding: 0 20px 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
    }}
    .share-bar {{
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      width: 100%;
      max-width: 520px;
    }}
    .share-btn {{
      flex: 1;
      min-width: 120px;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid #44403c;
      background: #292524;
      color: #fafaf9;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      transition: background 0.15s;
    }}
    .share-btn:hover {{ background: #44403c; }}
    .share-btn.primary {{
      background: #6366f1;
      border-color: #6366f1;
    }}
    .share-btn.primary:hover {{ background: #4f46e5; }}
    .section-title {{
      width: 100%;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #a8a29e;
      margin: 8px 0 0;
    }}
    .binder-wrap {{ width: 100%; max-width: 520px; }}
    .binder-pager {{
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 16px;
    }}
    .pager-btn {{
      padding: 10px 20px;
      border-radius: 10px;
      background: #292524;
      border: 1px solid #44403c;
      color: #fafaf9;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
    }}
    .pager-btn:hover {{ background: #44403c; }}
    .toast {{
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(80px);
      background: #22c55e;
      color: #fff;
      padding: 12px 24px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 14px;
      opacity: 0;
      transition: transform 0.25s, opacity 0.25s;
      pointer-events: none;
      z-index: 100;
    }}
    .toast.show {{ transform: translateX(-50%) translateY(0); opacity: 1; }}
    .hcard {{ margin: 0 auto; }}
  </style>
</head>
<body>
  <header class="topbar">
    <div class="brand">🤗 <span>HuggiMon</span></div>
    <a href="{app_url_escaped}">Open studio ↗</a>
  </header>

  <section class="hero">
    <h1>{display_name}</h1>
    <div class="handle">@{username}</div>
    <div class="badges">
      <span class="badge">LV {card.level}</span>
      <span class="badge">{html.escape(card.type)}</span>
      <span class="badge">{html.escape(card.rarity)}</span>
      <span class="badge">{card.energy_symbol} {html.escape(card.energy_name)} ×{card.energy_count}</span>
    </div>
  </section>

  <main class="layout">
    {card_fragment}

    <div class="share-bar">
      <button type="button" class="share-btn primary" id="copy-link">Copy link</button>
      <a class="share-btn" href="{card_png_escaped}" download="{username}-huggimon.png">Download PNG</a>
      <a class="share-btn" href="https://twitter.com/intent/tweet?text={html.escape('Check out my HuggiMon trainer card!', quote=True)}&amp;url={profile_url_escaped}" target="_blank" rel="noopener">Share on X</a>
    </div>

    <h2 class="section-title">Follower binder</h2>
    <div class="binder-wrap">
      {binder_fragment}
      <div class="binder-pager">{prev_link}{next_link}</div>
    </div>
  </main>

  <div class="toast" id="toast">Link copied!</div>

  <script>
    document.getElementById("copy-link").addEventListener("click", function () {{
      navigator.clipboard.writeText("{profile_url_escaped}").then(function () {{
        var t = document.getElementById("toast");
        t.classList.add("show");
        setTimeout(function () {{ t.classList.remove("show"); }}, 2000);
      }});
    }});
  </script>
</body>
</html>"""
