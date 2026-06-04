# QuickTill Pi App — Ekran Yöneticisi
from luma.core.interface.serial import spi
from luma.lcd.device import ili9341
from luma.core.render import canvas
from PIL import ImageFont, ImageDraw, Image
import os
from config import *

# Ekranı başlat
def init_display():
    serial = spi(
        port=DISPLAY_SPI_PORT,
        device=DISPLAY_SPI_DEVICE,
        gpio_DC=DISPLAY_DC_PIN,
        gpio_RST=DISPLAY_RST_PIN,
        bus_speed_hz=DISPLAY_SPEED,
    )
    device = ili9341(serial, rotate=DISPLAY_ROTATE)
    return device


# Yazı tipi yükle (yoksa varsayılan kullan)
def load_font(size=14, bold=False):
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


# ── Ortak UI bileşenleri ──────────────────────

def draw_header(draw, title: str, subtitle: str = ""):
    """Üst başlık çubuğu"""
    draw.rectangle((0, 0, 239, 44), fill=COLOR_PRIMARY)
    font_big = load_font(16, bold=True)
    font_small = load_font(11)
    draw.text((12, 8), title, font=font_big, fill=COLOR_WHITE)
    if subtitle:
        draw.text((12, 28), subtitle, font=font_small, fill="#A5D6A7")


def draw_button(draw, x, y, w, h, text: str, color=None, text_color=None):
    """Buton çiz"""
    color = color or COLOR_PRIMARY
    text_color = text_color or COLOR_WHITE
    draw.rounded_rectangle((x, y, x+w, y+h), radius=8, fill=color)
    font = load_font(13, bold=True)
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((x + (w-tw)//2, y + (h-th)//2 - 1), text, font=font, fill=text_color)


def draw_toast(draw, message: str, color=None):
    """Alt kısımda bildirim"""
    color = color or COLOR_SUCCESS
    draw.rectangle((0, 290, 239, 319), fill=color)
    font = load_font(12, bold=True)
    bbox = font.getbbox(message)
    tw = bbox[2] - bbox[0]
    draw.text(((240-tw)//2, 300), message, font=font, fill=COLOR_WHITE)
