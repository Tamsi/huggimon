"""Interactive binder controls (page flip pager) for the public profile page."""

import json


def render_binder_interactive(username: str) -> str:
    """Return a scoped <style> + <script> block for animated binder paging."""
    username_js = json.dumps(username)

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

  function init() {{
    var binder = getBinder();
    if (!binder) {{
      return;
    }}

    hideServerPager();
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
