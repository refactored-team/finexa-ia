"""
Root conftest — expose this directory as the `pipeline` package so tests
can run directly without a package install step.

The Docker image copies this directory to `/app/pipeline/`, which is why
imports use `pipeline.*`. Locally we fake that layout via sys.modules.
"""

from __future__ import annotations

import pathlib
import sys
import types

_ROOT = pathlib.Path(__file__).resolve().parent

if "pipeline" not in sys.modules:
    _pkg = types.ModuleType("pipeline")
    _pkg.__path__ = [str(_ROOT)]
    sys.modules["pipeline"] = _pkg
