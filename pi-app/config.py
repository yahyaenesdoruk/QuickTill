# QuickTill Pi App — Ayarlar
# ─────────────────────────────────────────────
# Backend API (Render'daki sunucu)
API_BASE_URL = "https://quicktill-backend.onrender.com/api"

# ILI9341 Ekran (bitbang SPI — GPIO pin numaraları BCM)
DISPLAY_ROTATE = 1          # 1 = portrait 240x320
DISPLAY_SCLK_PIN = 11       # Pin 23
DISPLAY_MOSI_PIN = 10       # Pin 19
DISPLAY_CS_PIN   = 8        # Pin 24
DISPLAY_DC_PIN   = 24       # Pin 18
DISPLAY_RST_PIN  = 25       # Pin 22

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
