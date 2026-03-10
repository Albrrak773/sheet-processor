#!/usr/bin/env python3
from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path


def ensure_venv() -> None:
    project_root = Path(__file__).parent.resolve()
    venv_python = project_root / ".venv" / "bin" / "python"

    in_venv = hasattr(sys, "real_prefix") or (
        hasattr(sys, "base_prefix") and sys.base_prefix != sys.prefix
    )

    if not in_venv:
        if venv_python.exists():
            print(f"Re-running with virtual environment Python: {venv_python}")
            os.execvp(str(venv_python), [str(venv_python), __file__])
        else:
            print("No virtual environment found. Please run 'uv sync' first.")
            sys.exit(1)


def load_env() -> dict[str, str]:
    from dotenv import load_dotenv

    env_path = Path(__file__).parent / ".env"
    load_dotenv(env_path)
    return dict(os.environ)


def is_docker_running() -> bool:
    try:
        result = subprocess.run(
            ["docker", "info"],
            capture_output=True,
            text=True,
        )
        return result.returncode == 0
    except FileNotFoundError:
        return False


def is_mysql_container_running() -> bool:
    try:
        result = subprocess.run(
            ["docker", "compose", "ps", "-q"],
            capture_output=True,
            text=True,
        )
        return bool(result.stdout.strip())
    except FileNotFoundError:
        return False


def start_mysql() -> None:
    print("Starting MySQL container...")
    result = subprocess.run(
        ["docker", "compose", "up", "-d"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        stderr = result.stderr
        if "port is already allocated" in stderr:
            port = "3306"
            for line in stderr.split("\n"):
                if "Bind for" in line and "failed: port is already allocated" in line:
                    parts = line.split(":")
                    if len(parts) >= 2:
                        port = parts[-2].split()[-1]
                        break
            print(f"\nPort {port} is already in use.")
            print("Another MySQL service or container is already running on this port.")
            print("\nOptions:")
            print("  1. Stop the existing MySQL service/container")
            print("  2. Change the port in docker-compose.yml")
            sys.exit(1)
        print(f"Failed to start MySQL: {stderr}")
        sys.exit(1)
    print("MySQL container started.")


def wait_for_mysql(max_attempts: int = 30, delay: float = 2.0) -> None:
    print("Waiting for MySQL to be ready...")
    for attempt in range(1, max_attempts + 1):
        try:
            result = subprocess.run(
                [
                    "docker",
                    "compose",
                    "exec",
                    "-T",
                    "mysql",
                    "mysqladmin",
                    "ping",
                    "-h",
                    "localhost",
                    "-u",
                    "root",
                    "-prootpassword",
                ],
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                print("MySQL is ready!")
                return
        except subprocess.SubprocessError:
            pass

        if attempt < max_attempts:
            print(f"  Attempt {attempt}/{max_attempts} - MySQL not ready yet, waiting...")
            time.sleep(delay)

    print("MySQL failed to become ready in time")
    sys.exit(1)


def main() -> None:
    project_root = Path(__file__).parent
    os.chdir(project_root)

    env = load_env()
    environment = env.get("ENVIRONMENT", "development").lower()
    is_development = environment == "development"

    print(f"Environment: {environment}")

    if is_development:
        if not is_docker_running():
            print("Docker is not running. Please start Docker first.")
            sys.exit(1)

        if not is_mysql_container_running():
            start_mysql()
            wait_for_mysql()
        else:
            print("MySQL container is already running.")

    print("\nDatabase tables will be created automatically on startup.")

    print("\nStarting FastAPI server on http://0.0.0.0:8000")
    print("Press CTRL+C to stop\n")

    if is_development:
        command = ["fastapi", "dev", "app/main.py"]
    else:
        command = ["fastapi", "run", "app/main.py"]
    os.execvp("fastapi", command)


if __name__ == "__main__":
    ensure_venv()
    main()
