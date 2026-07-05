"""Tests for interactive binder paging on the profile page."""

import json
import shutil
import subprocess
import tempfile

import pytest

from src.binder_interactive import render_binder_interactive


def _extract_script_body(html: str) -> str:
    """Return the full inline script body (not truncated at embedded </script>)."""
    start = html.index("<script>") + len("<script>")
    end = html.rindex("</script>")
    return html[start:end]


class TestRenderBinderInteractive:
    def test_contains_pager_and_navigation_markers(self):
        out = render_binder_interactive("tamsi")
        assert "hbi-binder-wrap" in out
        assert "hbi-prev" in out
        assert "hbi-next" in out
        assert "hbi-pager-label" in out
        assert "matchMedia" in out
        assert "transitionend" in out
        assert "replaceState" in out
        assert "/api/binder/" in out

    def test_contains_card_pull_out_markers(self):
        out = render_binder_interactive("tamsi")
        assert "hbi-ready" in out
        assert "hbi-overlay" in out
        assert "hbi-zoomed" in out
        assert 'role="dialog"' in out or 'role", "dialog"' in out
        assert "aria-modal" in out
        assert 'aria-label="Close"' in out or 'aria-label", "Close"' in out
        assert "closest" in out
        assert "Escape" in out
        assert "overflow" in out

    def test_username_json_encoded_safely(self):
        evil = 'evil"})</script>'
        out = render_binder_interactive(evil)

        assert out.count("</script>") == 1

        script_body = _extract_script_body(out)
        assert "</script>" not in script_body

        assert "<\\/script>" in out or "\\u003c/script>" in out

        encoded = json.dumps(evil).replace("</", "<\\/")
        assert encoded in out

    @pytest.mark.skipif(shutil.which("node") is None, reason="node not available")
    def test_javascript_syntax_valid(self):
        out = render_binder_interactive("tamsi")
        js = _extract_script_body(out)

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".js", delete=False
        ) as tmp:
            tmp.write(js)
            tmp_path = tmp.name

        result = subprocess.run(
            ["node", "--check", tmp_path],
            capture_output=True,
            text=True,
            check=False,
        )
        assert result.returncode == 0, result.stderr

    @pytest.mark.skipif(shutil.which("node") is None, reason="node not available")
    def test_javascript_syntax_valid_with_script_breaking_username(self):
        evil = 'evil"})</script>'
        out = render_binder_interactive(evil)
        js = _extract_script_body(out)

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".js", delete=False
        ) as tmp:
            tmp.write(js)
            tmp_path = tmp.name

        result = subprocess.run(
            ["node", "--check", tmp_path],
            capture_output=True,
            text=True,
            check=False,
        )
        assert result.returncode == 0, result.stderr
