"""
CloudPulse - Unified Cloud Operations & Intelligent Auto-Scaling Platform Launcher
==================================================================================
One-click orchestrator that boots:
1. Python FastAPI Backend Engine on http://127.0.0.1:8001
2. React 19 + TypeScript + Vite Frontend on http://127.0.0.1:5174
3. Automatically opens the platform in your default browser.
"""

from __future__ import annotations

import os
import sys
import time
import socket
import webbrowser
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
FRONTEND_DIR = BASE_DIR / "frontend"


def is_port_open(port: int, host: str = "127.0.0.1") -> bool:
    """Check if a service is accepting socket connections."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False


def start_backend():
    """Start the Python FastAPI backend on port 8001."""
    if is_port_open(8001):
        print("[+] CloudPulse Backend API is already active on http://127.0.0.1:8001")
        return None

    print("[*] Starting CloudPulse FastAPI backend on http://127.0.0.1:8001 ...")
    creationflags = 0
    if sys.platform == "win32":
        creationflags = subprocess.CREATE_NO_WINDOW | getattr(subprocess, "DETACHED_PROCESS", 0x00000008)

    cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001"]
    proc = subprocess.Popen(
        cmd,
        cwd=str(BACKEND_DIR),
        creationflags=creationflags,
    )

    for _ in range(12):
        if is_port_open(8001):
            print("[+] CloudPulse Backend API initialized successfully.")
            return proc
        time.sleep(0.5)

    return proc


def main():
    print("=" * 70)
    print("⚡ CLOUDPULSE — CLOUD OPERATIONS & AUTONOMOUS AUTO-SCALING PLATFORM")
    print("=" * 70)

    # 1. Start Backend API
    backend_proc = start_backend()

    # 2. Check or Start Frontend
    if is_port_open(5174):
        print("[+] CloudPulse Web Console is already active on http://127.0.0.1:5174")
        webbrowser.open("http://127.0.0.1:5174")
        return

    print("[*] Launching CloudPulse Frontend Console on http://127.0.0.1:5174 ...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    cmd = [npm_cmd, "run", "dev", "--", "--host", "127.0.0.1", "--port", "5174"]

    def open_browser_later():
        time.sleep(2.0)
        webbrowser.open("http://127.0.0.1:5174")

    import threading
    threading.Thread(target=open_browser_later, daemon=True).start()

    try:
        subprocess.run(cmd, cwd=str(FRONTEND_DIR))
    except KeyboardInterrupt:
        print("\n[*] Shutting down CloudPulse. Goodbye!")


if __name__ == "__main__":
    main()

