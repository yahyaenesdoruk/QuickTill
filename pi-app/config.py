# QuickTill Pi App — Ayarlar
# ─────────────────────────────────────────────
# Backend API (Render'daki sunucu)
API_BASE_URL = "https://quicktill-backend.onrender.com/api"

# ILI9341 Ekran
DISPLAY_ROTATE = 1          # 1 = portrait 240x320
DISPLAY_SPI_PORT = 0
DISPLAY_SPI_DEVICE = 0
DISPLAY_DC_PIN = 24
DISPLAY_RST_PIN = 25
DISPLAY_SPEED = 32000000

# ESP32-CAM barkod servisi
BARCODE_WS_URL = "ws://localhost:8765"

# Renkler (QuickTill yeşil teması)
COLOR_PRIMARY    = "#2E7D32"
COLOR_PRIMARY_LT = "#4CAF50"
COLOR_BG         = "#F5F5F5"
COLOR_WHITE      = "#FFFFFF"
COLOR_TEXT       = "#212121"
COLOR_TEXT_SEC   = "#757575"
COLOR_ERROR      = "#D32F2F"
COLOR_SUCCESS    = "#388E3C"
COLOR_ORANGE     = "#FF6F00"
