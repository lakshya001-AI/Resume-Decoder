"""Environment loading.

Importing this module is what puts Backend/.env into os.environ, so every module
that reads configuration imports from here rather than touching os.environ
directly — that way the load always happens first, whatever the import order.
"""

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"))


def get(name: str, default: Optional[str] = None) -> Optional[str]:
    value = os.environ.get(name)
    return value if value else default


def require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"{name} is not set. Copy Backend/.env.example to Backend/.env and fill it in."
        )
    return value
