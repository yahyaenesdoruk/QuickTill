#!/usr/bin/env python3
"""
QuickTill Pi App
================
ILI9341 240x320 ekran için native POS uygulaması.
Backend: https://quicktill-backend.onrender.com/api

Ekranlar:
  CART    → Sepet (ana ekran)
  SCANNER → Barkod bekleme
  PAYMENT → Ödeme onayı
"""

import time
import threading
import websocket
import json

from luma.core.render import canvas
from display import init_display, draw_header, draw_button, draw_toast, load_font
import cart as Cart
import api as Api
from config import BARCODE_WS_URL, COLOR_BG, COLOR_WHITE, COLOR_TEXT, COLOR_TEXT_SEC, \
    COLOR_PRIMARY, COLOR_PRIMARY_LT, COLOR_ERROR, COLOR_SUCCESS, COLOR_ORANGE


# ── Global durum ──────────────────────────────────────────────────────────────
device = None
current_screen = "CART"   # CART | SCANNER | PAYMENT
toast_msg = ""
toast_color = COLOR_SUCCESS
toast_until = 0.0
scanner_status = "connecting"   # connecting | ready | error


# ── Toast ─────────────────────────────────────────────────────────────────────
def show_toast(msg: str, color=None, duration=2.5):
    global toast_msg, toast_color, toast_until
    toast_msg = msg
    toast_color = color or COLOR_SUCCESS
    toast_until = time.time() + duration


# ── Barkod WebSocket ──────────────────────────────────────────────────────────
def on_ws_message(ws, message):
    global current_screen
    try:
        data = json.loads(message)
        barcode = data.get("barcode")
        if barcode:
            handle_barcode(barcode)
    except Exception:
        pass


def handle_barcode(barcode: str):
    product = Api.find_by_barcode(barcode)
    if product:
        Cart.add_product(product)
        show_toast(f"+ {product['name']}", COLOR_SUCCESS)
        global current_screen
        current_screen = "CART"
    else:
        show_toast(f"Bulunamadi: {barcode}", COLOR_ERROR)


def on_ws_open(ws):
    global scanner_status
    scanner_status = "ready"


def on_ws_error(ws, err):
    global scanner_status
    scanner_status = "error"


def on_ws_close(ws, *args):
    global scanner_status
    scanner_status = "error"


def start_ws():
    """WebSocket bağlantısını arka planda başlat, bağlantı kopunca tekrar dene"""
    global scanner_status
    while True:
        scanner_status = "connecting"
        try:
            ws = websocket.WebSocketApp(
                BARCODE_WS_URL,
                on_message=on_ws_message,
                on_open=on_ws_open,
                on_error=on_ws_error,
                on_close=on_ws_close,
            )
            ws.run_forever()
        except Exception:
            pass
        time.sleep(3)


# ── Ekran çizimi ──────────────────────────────────────────────────────────────

def draw_cart(draw):
    """Sepet ekranı"""
    draw.rectangle((0, 0, 239, 319), fill=COLOR_BG)
    items = Cart.get_cart()
    count = Cart.get_item_count()
    total = Cart.get_total()

    draw_header(draw, "QuickTill", f"{count} urun")

    font_name = load_font(13, bold=True)
    font_price = load_font(13)
    font_small = load_font(11)

    if not items:
        # Boş sepet
        font_empty = load_font(14)
        draw.text((55, 140), "Sepet bos", font=font_empty, fill=COLOR_TEXT_SEC)
        draw.text((30, 160), "Barkod okutun veya tara", font=font_small, fill=COLOR_TEXT_SEC)
    else:
        # Ürün listesi (max 4 ürün göster)
        y = 52
        for item in items[:4]:
            draw.rectangle((8, y, 231, y+36), fill=COLOR_WHITE)
            name = item["name"][:18] + "…" if len(item["name"]) > 18 else item["name"]
            draw.text((14, y+4), name, font=font_name, fill=COLOR_TEXT)
            price_str = f"{item['price']:.2f} x{item['quantity']}"
            draw.text((14, y+20), price_str, font=font_small, fill=COLOR_TEXT_SEC)
            total_str = f"{item['price'] * item['quantity']:.2f} TL"
            bbox = font_price.getbbox(total_str)
            tw = bbox[2] - bbox[0]
            draw.text((225 - tw, y+12), total_str, font=font_price, fill=COLOR_PRIMARY)
            y += 40

        if len(items) > 4:
            draw.text((80, y+2), f"+{len(items)-4} urun daha", font=font_small, fill=COLOR_TEXT_SEC)

    # Alt bar — toplam + butonlar
    draw.rectangle((0, 248, 239, 289), fill=COLOR_WHITE)
    font_total = load_font(15, bold=True)
    draw.text((12, 258), "Toplam:", font=font_small, fill=COLOR_TEXT_SEC)
    draw.text((12, 270), f"{total:.2f} TL", font=font_total, fill=COLOR_PRIMARY)

    draw_button(draw, 138, 252, 96, 34, "ODEME", COLOR_ORANGE)

    # Alt navigasyon
    draw_nav(draw, "cart")

    # Toast
    _draw_toast_if_active(draw)


def draw_scanner(draw):
    """Barkod tarayıcı ekranı"""
    draw.rectangle((0, 0, 239, 319), fill=COLOR_BG)
    draw_header(draw, "Barkod Tara")

    font = load_font(13)
    font_small = load_font(11)

    # Durum ikonu alanı
    draw.rectangle((60, 70, 179, 189), fill=COLOR_WHITE)
    draw.rectangle((64, 74, 175, 185), outline=COLOR_PRIMARY, width=3)

    if scanner_status == "ready":
        draw.text((78, 115), "HAZIR", font=load_font(16, bold=True), fill=COLOR_SUCCESS)
        draw.text((35, 200), "ESP32-CAM'i barkoda tut", font=font_small, fill=COLOR_TEXT_SEC)
        draw.text((55, 215), "Otomatik okuyacak", font=font_small, fill=COLOR_TEXT_SEC)
    elif scanner_status == "connecting":
        draw.text((68, 115), "Baglanıyor", font=font, fill=COLOR_PRIMARY)
        draw.text((30, 200), "barcode_service.py calisiyor mu?", font=font_small, fill=COLOR_TEXT_SEC)
    else:
        draw.text((68, 110), "BAGLI", font=font, fill=COLOR_ERROR)
        draw.text((68, 128), "DEGIL", font=font, fill=COLOR_ERROR)
        draw.text((20, 200), "barcode_service.py'yi baslatin", font=font_small, fill=COLOR_ERROR)

    # Manuel giriş butonu
    draw_button(draw, 20, 230, 199, 34, "Manuel Barkod Gir", COLOR_PRIMARY_LT)

    draw_nav(draw, "scanner")
    _draw_toast_if_active(draw)


def draw_payment(draw):
    """Ödeme ekranı"""
    draw.rectangle((0, 0, 239, 319), fill=COLOR_BG)
    draw_header(draw, "Odeme")

    total = Cart.get_total()
    count = Cart.get_item_count()

    font_big = load_font(28, bold=True)
    font = load_font(14)
    font_small = load_font(12)

    draw.rectangle((20, 60, 219, 140), fill=COLOR_WHITE)
    draw.text((35, 70), f"{count} urun", font=font_small, fill=COLOR_TEXT_SEC)
    draw.text((35, 88), "Toplam Tutar:", font=font, fill=COLOR_TEXT)

    bbox = font_big.getbbox(f"{total:.2f}")
    draw.text((35, 108), f"{total:.2f} TL", font=font_big, fill=COLOR_PRIMARY)

    draw_button(draw, 20, 160, 199, 44, "ODEMEYI ONAYLA", COLOR_SUCCESS)
    draw_button(draw, 20, 214, 199, 36, "Iptal", COLOR_ERROR)

    draw_nav(draw, "payment")
    _draw_toast_if_active(draw)


def draw_nav(draw, active: str):
    """Alt navigasyon çubuğu"""
    draw.rectangle((0, 298, 239, 319), fill=COLOR_WHITE)
    font = load_font(10)

    tabs = [
        ("Sepet",   "cart",    0),
        ("Tara",    "scanner", 80),
        ("Odeme",   "payment", 160),
    ]
    for label, key, x in tabs:
        color = COLOR_PRIMARY if active == key else COLOR_TEXT_SEC
        draw.text((x + 18, 305), label, font=font, fill=color)
        if active == key:
            draw.rectangle((x + 2, 298, x + 76, 300), fill=COLOR_PRIMARY)


def _draw_toast_if_active(draw):
    if toast_msg and time.time() < toast_until:
        draw.rectangle((0, 278, 239, 297), fill=toast_color)
        font = load_font(11, bold=True)
        bbox = font.getbbox(toast_msg)
        tw = bbox[2] - bbox[0]
        draw.text(((240 - tw) // 2, 283), toast_msg, font=font, fill=COLOR_WHITE)


# ── Dokunmatik giriş ──────────────────────────────────────────────────────────
def handle_touch(x: int, y: int):
    """Ekrana dokunma koordinatlarını işle"""
    global current_screen

    if current_screen == "CART":
        # ODEME butonu (138-234, 252-286)
        if 138 <= x <= 234 and 252 <= y <= 286:
            if Cart.get_item_count() > 0:
                current_screen = "PAYMENT"
        # Alt nav
        _handle_nav_touch(x, y)

    elif current_screen == "SCANNER":
        _handle_nav_touch(x, y)

    elif current_screen == "PAYMENT":
        # Onayla butonu (20-219, 160-204)
        if 20 <= x <= 219 and 160 <= y <= 204:
            Cart.clear_cart()
            show_toast("Odeme tamamlandi!", COLOR_SUCCESS, 2.0)
            current_screen = "CART"
        # İptal butonu (20-219, 214-250)
        elif 20 <= x <= 219 and 214 <= y <= 250:
            current_screen = "CART"
        else:
            _handle_nav_touch(x, y)


def _handle_nav_touch(x: int, y: int):
    global current_screen
    if y >= 298:
        if x < 80:
            current_screen = "CART"
        elif x < 160:
            current_screen = "SCANNER"
        else:
            current_screen = "PAYMENT"


# ── Dokunmatik okuma ──────────────────────────────────────────────────────────
def start_touch_reader():
    """XPT2046 dokunmatik girişini arka planda dinle"""
    import evdev
    try:
        devices = [evdev.InputDevice(p) for p in evdev.list_devices()]
        touch_dev = next((d for d in devices if "touch" in d.name.lower() or
                         "xpt" in d.name.lower() or "ads" in d.name.lower()), None)
        if not touch_dev:
            print("[touch] Dokunmatik cihaz bulunamadi, dokunma devre disi")
            return

        print(f"[touch] {touch_dev.name} bulundu")
        x_raw = y_raw = 0
        for event in touch_dev.read_loop():
            if event.type == evdev.ecodes.EV_ABS:
                if event.code == evdev.ecodes.ABS_X:
                    x_raw = event.value
                elif event.code == evdev.ecodes.ABS_Y:
                    y_raw = event.value
            elif event.type == evdev.ecodes.EV_KEY and event.value == 1:
                # Koordinatları ekran boyutuna ölçekle (kalibrasyona göre ayarla)
                x = int(x_raw / 4096 * 240)
                y = int(y_raw / 4096 * 320)
                handle_touch(x, y)
    except Exception as e:
        print(f"[touch] Hata: {e}")


# ── Ana döngü ─────────────────────────────────────────────────────────────────
def main():
    global device, current_screen

    print("QuickTill Pi App basliyor...")
    device = init_display()
    print(f"Ekran: {device.width}x{device.height}")

    # WebSocket arka planda
    ws_thread = threading.Thread(target=start_ws, daemon=True)
    ws_thread.start()

    # Dokunmatik arka planda
    touch_thread = threading.Thread(target=start_touch_reader, daemon=True)
    touch_thread.start()

    print("Uygulama hazir. Cikis icin Ctrl+C")

    while True:
        with canvas(device) as draw:
            if current_screen == "CART":
                draw_cart(draw)
            elif current_screen == "SCANNER":
                draw_scanner(draw)
            elif current_screen == "PAYMENT":
                draw_payment(draw)

        time.sleep(0.08)   # ~12 FPS


if __name__ == "__main__":
    main()
