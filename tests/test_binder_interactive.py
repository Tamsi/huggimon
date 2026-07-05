"""Tests for interactive binder paging on the profile page."""

import json
import re
import shutil
import subprocess
import tempfile

import pytest

from src.binder_interactive import render_binder_interactive


class TestRenderBinderInteractive:
    def test_contains_pager_and_navigation_markers(self):
        out = render_binder_interactive("tamsi")
        assert "hbi-prev" in out
        assert "hbi-next" in out
        assert "hbi-pager-label" in out
        assert "matchMedia" in out
        assert "transitionend" in out
        assert "replaceState" in out
        assert "/api/binder/" in out

    def test_username_json_encoded_safely(self):
        evil = 'evil"})</script>'
        out = render_binder_interactive(evil)

        script_match = re.search(r"<script>(.*?)</script>", out, re.DOTALL)
        assert script_match is not None
        script_body = script_match.group(1)
        assert "</script>" not in script_body

        encoded = json.dumps(evil)
        assert encoded in out

    @pytest.mark.skipif(shutil.which("node") is None, reason="node not available")
    def test_javascript_syntax_valid(self):
        out = render_binder_interactive("tamsi")
        script_match = re.search(r"<script>(.*?)</script>", out, re.DOTALL)
        assert script_match is not None
        js = script_match.group(1)

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
