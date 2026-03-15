#!/usr/bin/env python3
from __future__ import annotations

import os
from pathlib import Path


def main() -> None:
    project_root = Path(__file__).parent.resolve()
    os.chdir(project_root)

    port = int(os.getenv("PORT", "7100"))
    workers = int(os.getenv("WORKERS", "1"))

    print(f"Starting FastAPI server on http://0.0.0.0:{port}")
    print(f"Workers: {workers}")

    os.execvp(
        "fastapi",
        ["fastapi", "run", "app/main.py", "--port", str(port), "--workers", str(workers)],
    )


if __name__ == "__main__":
    main()
