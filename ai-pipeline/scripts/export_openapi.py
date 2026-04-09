#!/usr/bin/env python3
"""
Export the OpenAPI 3.1 spec from the FastAPI app to docs/openapi.json.

Usage (from ai-pipeline/):
    python -m scripts.export_openapi           # via conftest alias
    python scripts/export_openapi.py           # via sys.path hack below
"""

from __future__ import annotations

import json
import pathlib
import sys
import types

# ── Make `pipeline.*` importable locally (mirrors Dockerfile layout) ──
_ROOT = pathlib.Path(__file__).resolve().parent.parent
if "pipeline" not in sys.modules:
    _pkg = types.ModuleType("pipeline")
    _pkg.__path__ = [str(_ROOT)]
    sys.modules["pipeline"] = _pkg

from pipeline.main import app  # noqa: E402

_OUT_DIR = _ROOT / "docs"
_OUT_FILE = _OUT_DIR / "openapi.json"


def main() -> None:
    schema = app.openapi()
    _OUT_DIR.mkdir(exist_ok=True)
    _OUT_FILE.write_text(
        json.dumps(schema, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"OpenAPI spec exported to {_OUT_FILE}  ({len(json.dumps(schema)):,} bytes)")


if __name__ == "__main__":
    main()