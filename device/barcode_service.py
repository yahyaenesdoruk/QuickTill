#!/usr/bin/env python3
"""
QuickTill Hardware Barcode Service
====================================
Desteklenen modlar:
  esp32cam  — ESP32-CAM MJPEG stream → pyzbar → WebSocket
  picamera  — Raspberry Pi Camera Module → pyzbar → WebSocket
  usb       — USB barkod okuyucu (HID/klavye) → WebSocket

Kullanım:
  python3 barcode_service.py --mode picamera
  python3 barcode_service.py --mode usb
  python3 barcode_service.py --mode esp32cam

Bağımlılıklar:
  esp32cam  : pip3 install pyzbar opencv-python-headless websockets numpy
  picamera  : sudo apt install python3-picamera2 libzbar0
              pip3 install pyzbar websockets numpy --break-system-packages
  usb       : pip3 install evdev websockets --break-system-packages
"""

import argparse
import asyncio
import json
import threading
import time

import websockets

# ── Config ────────────────────────────────────────────────────────────────────
ESP32_STREAM_URL = "http://192.168.1.42/stream"  # <- ESP32-CAM IP adresi
WS_HOST          = "localhost"
WS_PORT          = 8765
COOLDOWN_SEC     = 1.5   # aynı barkodun tekrar ateşlenmesi için bekleme süresi
# ─────────────────────────────────────────────────────────────────────────────

clients: set = set()
_event_loop: asyncio.AbstractEventLoop | None = None
_last_code: str = ""
_last_time: float = 0.0


# ── Ortak yardımcılar ─────────────────────────────────────────────────────────

def _emit(code: str) -> None:
    """Barkod kodunu WebSocket üzerinden tüm istemcilere gönder."""
    global _last_code, _last_time
    now = time.monotonic()
    if code and (code != _last_code or now - _last_time > COOLDOWN_SEC):
        _last_code = code
        _last_time = now
        print(f"[barcode] Tespit edildi: {code}")
        if _event_loop:
            asyncio.run_coroutine_threadsafe(_broadcast(code), _event_loop)


async def _broadcast(code: str) -> None:
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


# ── Mod 1: ESP32-CAM ──────────────────────────────────────────────────────────

def run_esp32cam() -> None:
    import urllib.request
    import cv2
    import numpy as np
    from pyzbar import pyzbar

    while True:
        try:
            print(f"[esp32cam] {ESP32_STREAM_URL} adresine bağlanılıyor...")
            stream = urllib.request.urlopen(ESP32_STREAM_URL, timeout=10)
            buf = b""
            print("[esp32cam] Bağlantı kuruldu — barkod taranıyor")

            while True:
                buf += stream.read(4096)
                a = buf.find(b"\xff\xd8")
                b = buf.find(b"\xff\xd9")
                if a != -1 and b != -1 and b > a:
                    jpg = buf[a : b + 2]
                    buf = buf[b + 2 :]
                    frame = cv2.imdecode(
                        np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_GRAYSCALE
                    )
                    if frame is None:
                        continue
                    for r in pyzbar.decode(frame):
                        _emit(r.data.decode("utf-8").strip())

        except Exception as e:
            print(f"[esp32cam] Hata: {e} — 3 saniye sonra yeniden deneniyor")
            time.sleep(3)


# ── Mod 2: Pi Camera Module ───────────────────────────────────────────────────

def run_picamera() -> None:
    """
    Raspberry Pi Camera Module (v1/v2/v3) ile barkod okuma.
    Gereksinim: sudo apt install -y python3-picamera2
    """
    try:
        from picamera2 import Picamera2
    except ImportError:
        print("[picamera] HATA: picamera2 bulunamadı.")
        print("  Kur: sudo apt install -y python3-picamera2")
        return

    import numpy as np
    from pyzbar import pyzbar

    picam2 = Picamera2()
    # Pi Camera Module 2 (IMX219): video modu daha hızlı, barkod için yeterli
    config = picam2.create_video_configuration(
        main={"size": (640, 480), "format": "RGB888"},
        controls={"FrameRate": 20}  # AfMode kaldırıldı: Pi Kamera 2 sabit odaklıdır
    )
    picam2.configure(config)
    picam2.start()
    print("[picamera] Pi Camera Module 2 başlatıldı — barkod taranıyor")

    try:
        while True:
            frame = picam2.capture_array()
            # RGB → Grayscale
            gray = (frame[..., 0] * 0.299 + frame[..., 1] * 0.587 + frame[..., 2] * 0.114).astype("uint8")
            for r in pyzbar.decode(gray):
                _emit(r.data.decode("utf-8").strip())
            time.sleep(0.05)  # ~20 fps
    finally:
        picam2.stop()


# ── Mod 3: USB Barkod Okuyucu (HID/Klavye) ────────────────────────────────────

def run_usb_scanner() -> None:
    """
    USB barkod okuyucular HID klavye olarak görünür.
    Linux'ta /dev/input/event* üzerinden okunur.
    Gereksinim: pip3 install evdev --break-system-packages
    """
    try:
        import evdev
        from evdev import InputDevice, categorize, ecodes
    except ImportError:
        print("[usb] HATA: evdev bulunamadı.")
        print("  Kur: pip3 install evdev --break-system-packages")
        return

    # Scan code → karakter haritası
    KEYMAP = {
        "KEY_0": "0", "KEY_1": "1", "KEY_2": "2", "KEY_3": "3", "KEY_4": "4",
        "KEY_5": "5", "KEY_6": "6", "KEY_7": "7", "KEY_8": "8", "KEY_9": "9",
        "KEY_A": "a", "KEY_B": "b", "KEY_C": "c", "KEY_D": "d", "KEY_E": "e",
        "KEY_F": "f", "KEY_G": "g", "KEY_H": "h", "KEY_I": "i", "KEY_J": "j",
        "KEY_K": "k", "KEY_L": "l", "KEY_M": "m", "KEY_N": "n", "KEY_O": "o",
        "KEY_P": "p", "KEY_Q": "q", "KEY_R": "r", "KEY_S": "s", "KEY_T": "t",
        "KEY_U": "u", "KEY_V": "v", "KEY_W": "w", "KEY_X": "x", "KEY_Y": "y",
        "KEY_Z": "z",
    }

    def find_scanner():
        for path in evdev.list_devices():
            try:
                dev = InputDevice(path)
                caps = dev.capabilities(verbose=True)
                if ("EV_KEY", ecodes.EV_KEY) in caps:
                    print(f"[usb] Aday cihaz: {dev.name} ({path})")
                    return dev
            except Exception:
                pass
        return None

    while True:
        device = find_scanner()
        if not device:
            print("[usb] USB barkod okuyucu bulunamadı — 5 saniye sonra tekrar aranıyor")
            time.sleep(5)
            continue

        print(f"[usb] '{device.name}' cihazı dinleniyor...")
        buf = []
        try:
            for event in device.read_loop():
                if event.type == evdev.ecodes.EV_KEY:
                    data = categorize(event)
                    if data.keystate == 1:  # key down
                        key = data.keycode if isinstance(data.keycode, str) else data.keycode[0]
                        if key == "KEY_ENTER":
                            code = "".join(buf).strip()
                            if code:
                                _emit(code)
                            buf = []
                        else:
                            ch = KEYMAP.get(key, "")
                            if ch:
                                buf.append(ch)
        except Exception as e:
            print(f"[usb] Cihaz bağlantısı kesildi: {e} — yeniden aranıyor")
            time.sleep(2)


# ── WebSocket sunucusu ─────────────────────────────────────────────────────────

async def ws_handler(websocket) -> None:
    clients.add(websocket)
    addr = websocket.remote_address
    print(f"[ws] İstemci bağlandı: {addr}  (toplam: {len(clients)})")
    try:
        await websocket.wait_closed()
    finally:
        clients.discard(websocket)
        print(f"[ws] İstemci ayrıldı: {addr}  (toplam: {len(clients)})")


async def main(mode: str) -> None:
    global _event_loop
    _event_loop = asyncio.get_running_loop()

    runner = {
        "esp32cam": run_esp32cam,
        "picamera": run_picamera,
        "usb":      run_usb_scanner,
    }.get(mode)

    if runner is None:
        print(f"[hata] Bilinmeyen mod: {mode}")
        print("  Geçerli modlar: esp32cam, picamera, usb")
        return

    t = threading.Thread(target=runner, daemon=True)
    t.start()

    async with websockets.serve(ws_handler, WS_HOST, WS_PORT):
        print(f"[ws] QuickTill barkod servisi çalışıyor: ws://{WS_HOST}:{WS_PORT}")
        print(f"[ws] Mod: {mode}")
        await asyncio.Future()  # sonsuza kadar çalış


# ── Giriş noktası ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="QuickTill Barcode Service")
    parser.add_argument(
        "--mode",
        choices=["esp32cam", "picamera", "usb"],
        default="usb",
        help="Barkod okuma modu (varsayılan: usb)",
    )
    args = parser.parse_args()
    asyncio.run(main(args.mode))
