#!/usr/bin/env python3
"""
QuickTill Hardware Barcode Service
===================================
ESP32-CAM MJPEG stream → pyzbar decode → WebSocket broadcast

Flow:
  ESP32-CAM (OV2640)  --WiFi-MJPEG-->  This script  --WS:8765-->  Chromium (QuickTill app)

Usage:
  1. Edit ESP32_STREAM_URL with your ESP32-CAM IP address
  2. pip3 install pyzbar opencv-python-headless websockets numpy
  3. sudo apt install libzbar0
  4. python3 barcode_service.py
"""

import asyncio
import json
import threading
import time
import urllib.request
import cv2
import numpy as np
import websockets
from pyzbar import pyzbar

# ── Config ────────────────────────────────────────────────────────────────────
ESP32_STREAM_URL = "http://192.168.1.42/stream"   # <- Change to your ESP32-CAM IP
WS_HOST = "localhost"
WS_PORT = 8765
COOLDOWN_SEC = 1.5   # seconds before same barcode can fire again
# ─────────────────────────────────────────────────────────────────────────────

clients: set = set()
_event_loop: asyncio.AbstractEventLoop | None = None
_last_code: str = ""
_last_time: float = 0.0


def decode_mjpeg_stream() -> None:
    """Read MJPEG frames from ESP32-CAM and decode barcodes with pyzbar."""
    global _last_code, _last_time

    while True:
        try:
            print(f"[barcode] Connecting to {ESP32_STREAM_URL} ...")
            stream = urllib.request.urlopen(ESP32_STREAM_URL, timeout=10)
            buf = b""
            print("[barcode] Stream connected — scanning for barcodes")

            while True:
                buf += stream.read(4096)
                a = buf.find(b"\xff\xd8")   # JPEG SOI marker
                b = buf.find(b"\xff\xd9")   # JPEG EOI marker
                if a != -1 and b != -1 and b > a:
                    jpg = buf[a : b + 2]
                    buf = buf[b + 2 :]

                    frame = cv2.imdecode(
                        np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_GRAYSCALE
                    )
                    if frame is None:
                        continue

                    results = pyzbar.decode(frame)
                    now = time.monotonic()

                    for r in results:
                        code = r.data.decode("utf-8").strip()
                        if code and (code != _last_code or now - _last_time > COOLDOWN_SEC):
                            _last_code = code
                            _last_time = now
                            print(f"[barcode] Detected: {code}")
                            if _event_loop:
                                asyncio.run_coroutine_threadsafe(
                                    broadcast(code), _event_loop
                                )

        except Exception as e:
            print(f"[barcode] Stream error: {e} — retrying in 3s")
            time.sleep(3)


async def broadcast(code: str) -> None:
    """Send barcode to all connected WebSocket clients."""
    if not clients:
        return
    msg = json.dumps({"barcode": code})
    dead = set()
    for ws in clients.copy():
        try:
            await ws.send(msg)
        except Exception:
            dead.add(ws)
    clients.difference_update(dead)


async def ws_handler(websocket) -> None:
    """Accept and track WebSocket connections."""
    clients.add(websocket)
    addr = websocket.remote_address
    print(f"[ws] Client connected: {addr}  (total: {len(clients)})")
    try:
        await websocket.wait_closed()
    finally:
        clients.discard(websocket)
        print(f"[ws] Client disconnected: {addr}  (total: {len(clients)})")


async def main() -> None:
    global _event_loop
    _event_loop = asyncio.get_running_loop()

    # Start MJPEG reader in background thread
    t = threading.Thread(target=decode_mjpeg_stream, daemon=True)
    t.start()

    async with websockets.serve(ws_handler, WS_HOST, WS_PORT):
        print(f"[ws] QuickTill barcode service running on ws://{WS_HOST}:{WS_PORT}")
        print("[ws] Waiting for browser connections...")
        await asyncio.Future()   # run forever


if __name__ == "__main__":
    asyncio.run(main())
