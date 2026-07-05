"""Interactive binder controls (page flip pager) for the public profile page."""

import json


def _js_string_for_script_tag(value: str) -> str:
    """JSON-encode a value and escape ``</`` so it cannot close an HTML script tag."""
    return json.dumps(value).replace("</", "<\\/")


def render_binder_interactive(username: str) -> str:
    """Return a scoped <style> + <script> block for animated binder paging."""
    username_js = _js_string_for_script_tag(username)

    return f"""<style>
#hbi-binder-wrap {{
  perspective: 1400px;
  position: relative;
}}
.hbi-flip-out-next {{
  transform: rotateY(-90deg);
  transform-origin: left center;
  transition: transform 220ms ease-in;
}}
.hbi-flip-out-prev {{
  transform: rotateY(90deg);
  transform-origin: right center;
  transition: transform 220ms ease-in;
}}
.hbi-flip-in-next {{
  transform: rotateY(90deg);
  transform-origin: left center;
  transition: transform 220ms ease-out;
}}
.hbi-flip-in-prev {{
  transform: rotateY(-90deg);
  transform-origin: right center;
  transition: transform 220ms ease-out;
}}
.hbi-pager {{
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}}
.hbi-pager-btn {{
  padding: 10px 20px;
  border-radius: 10px;
  background: #292524;
  border: 1px solid #44403c;
  color: #fafaf9;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}}
.hbi-pager-btn:hover:not(:disabled) {{
  background: #44403c;
}}
.hbi-pager-btn:disabled {{
  opacity: 0.4;
  cursor: not-allowed;
}}
.hbi-pager-label {{
  color: #a8a29e;
  font-size: 13px;
  font-weight: 600;
}}
.hbi-server-pager {{
  display: none;
}}
.hbi-ready .hpkm-card {{
  cursor: pointer;
  transition: transform 150ms ease;
}}
.hbi-ready .hpkm-card:hover {{
  transform: translateY(-3px);
}}
.hbi-overlay {{
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}}
.hbi-overlay.hbi-fade-in {{
  animation: hbi-fade-in 200ms ease forwards;
}}
.hbi-overlay.hbi-fade-out {{
  animation: hbi-fade-out 200ms ease forwards;
}}
@keyframes hbi-fade-in {{
  from {{ opacity: 0; }}
  to {{ opacity: 1; }}
}}
@keyframes hbi-fade-out {{
  from {{ opacity: 1; }}
  to {{ opacity: 0; }}
}}
.hbi-zoomed {{
  will-change: transform;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08);
}}
.hbi-close {{
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10000;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(28, 25, 23, 0.85);
  color: #fafaf9;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}}
.hbi-close:hover {{
  background: rgba(68, 64, 60, 0.95);
}}
</style>
<script>
(function () {{
  var wrap = document.getElementById("hbi-binder-wrap");
  if (!wrap || wrap.getAttribute("data-hbi-bound") === "1") {{
    return;
  }}
  wrap.setAttribute("data-hbi-bound", "1");

  var username = {username_js};
  var flipping = false;
  var overlayOpen = false;

  function prefersReducedMotion() {{
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }}

  function getBinder() {{
    return wrap.querySelector(".hbinder");
  }}

  function readPageState(binder) {{
    return {{
      page: parseInt(binder.getAttribute("data-page"), 10) || 1,
      total: parseInt(binder.getAttribute("data-total-pages"), 10) || 1,
    }};
  }}

  function hideServerPager() {{
    var parent = wrap.parentElement;
    if (!parent) {{
      return;
    }}
    var serverPager = parent.querySelector(".binder-pager");
    if (serverPager) {{
      serverPager.classList.add("hbi-server-pager");
    }}
  }}

  function waitTransition(el, fallbackMs) {{
    return new Promise(function (resolve) {{
      var done = false;
      function finish() {{
        if (done) {{
          return;
        }}
        done = true;
        el.removeEventListener("transitionend", onEnd);
        resolve();
      }}
      function onEnd(ev) {{
        if (ev.target === el && ev.propertyName === "transform") {{
          finish();
        }}
      }}
      el.addEventListener("transitionend", onEnd);
      setTimeout(finish, fallbackMs);
    }});
  }}

  function updatePagerControls(pager, page, total) {{
    var prevBtn = pager.querySelector(".hbi-prev");
    var nextBtn = pager.querySelector(".hbi-next");
    var label = pager.querySelector(".hbi-pager-label");
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= total;
    label.textContent = page + " / " + total;
  }}

  function swapBinderHtml(html) {{
    wrap.innerHTML = html;
    return getBinder();
  }}

  function buildPager() {{
    var pager = document.createElement("div");
    pager.className = "hbi-pager";
    pager.innerHTML =
      '<button type="button" class="hbi-pager-btn hbi-prev">◀ Prev</button>' +
      '<span class="hbi-pager-label"></span>' +
      '<button type="button" class="hbi-pager-btn hbi-next">Next ▶</button>';
    wrap.insertAdjacentElement("afterend", pager);
    return pager;
  }}

  function navigateToPage(pager, currentPage, totalPages, targetPage) {{
    if (flipping || targetPage === currentPage) {{
      return Promise.resolve(currentPage);
    }}
    if (targetPage < 1 || targetPage > totalPages) {{
      return Promise.resolve(currentPage);
    }}

    flipping = true;
    var prevBtn = pager.querySelector(".hbi-prev");
    var nextBtn = pager.querySelector(".hbi-next");
    prevBtn.disabled = true;
    nextBtn.disabled = true;

    var direction = targetPage > currentPage ? "next" : "prev";
    var url =
      "/api/binder/" +
      encodeURIComponent(username) +
      "/html?page=" +
      targetPage;

    return fetch(url)
      .then(function (resp) {{
        if (!resp.ok) {{
          throw new Error("fetch failed");
        }}
        return resp.text();
      }})
      .then(function (html) {{
        var binder = getBinder();
        if (!binder) {{
          throw new Error("missing binder");
        }}

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {{
          binder = swapBinderHtml(html);
          if (!binder) {{
            throw new Error("missing binder");
          }}
          var state = readPageState(binder);
          history.replaceState(null, "", "?page=" + targetPage);
          updatePagerControls(pager, state.page, state.total);
          return state.page;
        }}

        var outClass =
          direction === "next" ? "hbi-flip-out-next" : "hbi-flip-out-prev";
        var inClass =
          direction === "next" ? "hbi-flip-in-next" : "hbi-flip-in-prev";

        binder.classList.add(outClass);
        return waitTransition(binder, 300).then(function () {{
          binder.classList.remove(outClass);
          binder = swapBinderHtml(html);
          if (!binder) {{
            throw new Error("missing binder");
          }}

          binder.classList.add(inClass);
          binder.style.transition = "none";
          void binder.offsetWidth;
          binder.style.transition = "";
          binder.classList.remove(inClass);

          return waitTransition(binder, 300).then(function () {{
            binder.classList.remove("hbi-flip-in-next", "hbi-flip-in-prev");
            var state = readPageState(binder);
            history.replaceState(null, "", "?page=" + targetPage);
            updatePagerControls(pager, state.page, state.total);
            return state.page;
          }});
        }});
      }})
      .catch(function () {{
        updatePagerControls(pager, currentPage, totalPages);
        return currentPage;
      }})
      .finally(function () {{
        flipping = false;
      }});
  }}

  function openCardOverlay(sourceCard) {{
    if (overlayOpen) {{
      return;
    }}
    overlayOpen = true;

    var sourceRect = sourceCard.getBoundingClientRect();
    var reducedMotion = prefersReducedMotion();
    var targetWidth = Math.min(window.innerWidth * 0.6, 340);
    var scale = targetWidth / sourceRect.width;
    var targetHeight = sourceRect.height * scale;
    var centerX = window.innerWidth / 2;
    var centerY = window.innerHeight / 2;
    var targetLeft = centerX - targetWidth / 2;
    var targetTop = centerY - targetHeight / 2;

    var overlay = document.createElement("div");
    overlay.className = "hbi-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "hbi-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "\u00d7";

    var clone = sourceCard.cloneNode(true);
    clone.classList.add("hbi-zoomed");
    clone.style.position = "fixed";
    clone.style.left = sourceRect.left + "px";
    clone.style.top = sourceRect.top + "px";
    clone.style.width = sourceRect.width + "px";
    clone.style.height = sourceRect.height + "px";
    clone.style.margin = "0";
    clone.style.transformOrigin = "center center";
    clone.style.zIndex = "10001";
    clone.style.pointerEvents = "none";

    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
    document.body.appendChild(clone);

    var prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    var closing = false;
    var tiltRaf = 0;
    var tiltX = 0;
    var tiltY = 0;
    var finalDx = targetLeft - sourceRect.left;
    var finalDy = targetTop - sourceRect.top;

    function applyTransform(tx, ty, sc, rx, ry) {{
      clone.style.transform =
        "translate(" +
        tx +
        "px, " +
        ty +
        "px) scale(" +
        sc +
        ") rotateX(" +
        rx +
        "deg) rotateY(" +
        ry +
        "deg)";
    }}

    function onPointerMove(ev) {{
      if (closing || reducedMotion) {{
        return;
      }}
      var rect = overlay.getBoundingClientRect();
      var nx = (ev.clientX - rect.left) / rect.width - 0.5;
      var ny = (ev.clientY - rect.top) / rect.height - 0.5;
      tiltX = ny * -14;
      tiltY = nx * 14;
      if (!tiltRaf) {{
        tiltRaf = requestAnimationFrame(function () {{
          tiltRaf = 0;
          if (!closing) {{
            applyTransform(finalDx, finalDy, scale, tiltX, tiltY);
          }}
        }});
      }}
    }}

    function animateToTarget() {{
      return new Promise(function (resolve) {{
        if (reducedMotion) {{
          overlay.classList.add("hbi-fade-in");
          clone.style.opacity = "1";
          resolve();
          return;
        }}

        var dx = targetLeft - sourceRect.left;
        var dy = targetTop - sourceRect.top;
        clone.style.transition =
          "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease";
        requestAnimationFrame(function () {{
          applyTransform(dx, dy, scale, 0, 0);
        }});

        waitTransition(clone, 400).then(resolve);
      }});
    }}

    function closeOverlay() {{
      if (closing) {{
        return;
      }}
      closing = true;
      overlay.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("keydown", onKeyDown);

      var sourceGone = !document.body.contains(sourceCard);
      var returnRect = sourceGone
        ? null
        : sourceCard.getBoundingClientRect();

      function finishClose() {{
        if (tiltRaf) {{
          cancelAnimationFrame(tiltRaf);
        }}
        overlay.remove();
        clone.remove();
        document.documentElement.style.overflow = prevOverflow;
        overlayOpen = false;
      }}

      if (reducedMotion || sourceGone) {{
        overlay.classList.remove("hbi-fade-in");
        overlay.classList.add("hbi-fade-out");
        clone.style.transition = "opacity 200ms ease";
        clone.style.opacity = "0";
        setTimeout(finishClose, 220);
        return;
      }}

      var dx = returnRect.left - sourceRect.left;
      var dy = returnRect.top - sourceRect.top;
      var returnScale = returnRect.width / sourceRect.width;
      clone.style.transition =
        "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease";
      applyTransform(dx, dy, returnScale, 0, 0);

      waitTransition(clone, 400).then(function () {{
        overlay.style.transition = "opacity 200ms ease";
        overlay.style.opacity = "0";
        setTimeout(finishClose, 220);
      }});
    }}

    function onBackdropClick(ev) {{
      if (ev.target === overlay) {{
        closeOverlay();
      }}
    }}

    function onKeyDown(ev) {{
      if (ev.key === "Escape") {{
        closeOverlay();
      }}
    }}

    overlay.addEventListener("click", onBackdropClick);
    closeBtn.addEventListener("click", closeOverlay);
    overlay.addEventListener("pointermove", onPointerMove);
    document.addEventListener("keydown", onKeyDown);

    if (reducedMotion) {{
      overlay.classList.add("hbi-fade-in");
      clone.style.opacity = "0";
      clone.style.transition = "opacity 200ms ease";
      requestAnimationFrame(function () {{
        clone.style.opacity = "1";
      }});
    }} else {{
      applyTransform(0, 0, 1, 0, 0);
    }}

    animateToTarget();
  }}

  function initCardPullOut() {{
    wrap.classList.add("hbi-ready");
    wrap.addEventListener("click", function (ev) {{
      var card = ev.target.closest(".hpkm-card");
      if (!card || !wrap.contains(card)) {{
        return;
      }}
      ev.preventDefault();
      openCardOverlay(card);
    }});
  }}

  function init() {{
    var binder = getBinder();
    if (!binder) {{
      return;
    }}

    hideServerPager();
    initCardPullOut();
    var pager = buildPager();
    var state = readPageState(binder);
    var currentPage = state.page;
    var totalPages = state.total;

    updatePagerControls(pager, currentPage, totalPages);

    pager.querySelector(".hbi-prev").addEventListener("click", function () {{
      navigateToPage(pager, currentPage, totalPages, currentPage - 1).then(
        function (page) {{
          currentPage = page;
          var latest = getBinder();
          if (latest) {{
            var latestState = readPageState(latest);
            totalPages = latestState.total;
          }}
        }}
      );
    }});

    pager.querySelector(".hbi-next").addEventListener("click", function () {{
      navigateToPage(pager, currentPage, totalPages, currentPage + 1).then(
        function (page) {{
          currentPage = page;
          var latest = getBinder();
          if (latest) {{
            var latestState = readPageState(latest);
            totalPages = latestState.total;
          }}
        }}
      );
    }});
  }}

  init();
}})();
</script>"""
