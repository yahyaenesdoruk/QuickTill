#!/bin/bash
# ============================================================
#  QuickTill Device Setup Script — Raspberry Pi
#  Sıfırdan kurulum için bir kez çalıştır
#  Kullanım: bash device/setup.sh [--barcode-mode usb|picamera|esp32cam]
# ============================================================
set -e

QUICKTILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEVICE_DIR="$QUICKTILL_DIR/device"
BARCODE_MODE="usb"   # Varsayılan: USB barkod okuyucu

# Argüman ayrıştırma
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --barcode-mode) BARCODE_MODE="$2"; shift ;;
        *) echo "Bilinmeyen parametre: $1"; exit 1 ;;
    esac
    shift
done

echo "======================================================"
echo " QuickTill Cihaz Kurulumu"
echo " Proje: $QUICKTILL_DIR"
echo " Barkod modu: $BARCODE_MODE"
echo "======================================================"

# ── 1. Sistem paketleri ───────────────────────────────────
echo "[1/8] Sistem paketleri kuruluyor..."
sudo apt-get update -y
sudo apt-get install -y \
    python3-pip \
    libzbar0t64 \
    cmake \
    git \
    libsdl2-dev \
    libsdl2-ttf-dev \
    libsdl2-image-dev \
    fonts-dejavu \
    evtest || true

# ── 2. Python paketleri ───────────────────────────────────
echo "[2/8] Python paketleri kuruluyor (mod: $BARCODE_MODE)..."

# Her modda gereken: pygame (native uygulama), requests (API), websockets, evdev (dokunmatik)
pip3 install --break-system-packages pygame requests websockets evdev

if [ "$BARCODE_MODE" = "esp32cam" ]; then
    pip3 install --break-system-packages pyzbar opencv-python-headless numpy
elif [ "$BARCODE_MODE" = "picamera" ]; then
    # picamera2 apt üzerinden kurulmalı (pip ile çalışmaz)
    sudo apt-get install -y python3-picamera2 || \
        echo "  [uyarı] python3-picamera2 bulunamadı, libcamera deneniyor..."
    sudo apt-get install -y libcamera-apps || true
    pip3 install --break-system-packages pyzbar numpy
elif [ "$BARCODE_MODE" = "usb" ]; then
    pip3 install --break-system-packages evdev
fi

# ── 3. SPI etkinleştir ────────────────────────────────────
echo "[3/8] SPI arayüzü etkinleştiriliyor..."
CONFIG_FILE="/boot/firmware/config.txt"
[ -f /boot/config.txt ] && CONFIG_FILE="/boot/config.txt"

if ! grep -q "^dtparam=spi=on" "$CONFIG_FILE" 2>/dev/null; then
    echo "dtparam=spi=on" | sudo tee -a "$CONFIG_FILE"
    echo "  → SPI $CONFIG_FILE dosyasına eklendi"
else
    echo "  → SPI zaten etkin"
fi

# XPT2046 dokunmatik sürücüsü (ads7846) — her kurulumda eklenir
if ! grep -q "dtoverlay=ads7846" "$CONFIG_FILE" 2>/dev/null; then
    echo "dtoverlay=ads7846,cs=1,penirq=17,speed=1000000,keep_vref_on=1,swapxy=0,pmax=255,xohms=150" \
        | sudo tee -a "$CONFIG_FILE"
    echo "  → XPT2046 (ads7846) dokunmatik sürücüsü eklendi"
else
    echo "  → XPT2046 zaten etkin"
fi

# Pi Camera Module 2 (IMX219) etkinleştir
if [ "$BARCODE_MODE" = "picamera" ]; then
    # Raspberry Pi OS Bullseye ve sonrası için dtoverlay kullan (start_x artık gerekmiyor)
    if ! grep -q "dtoverlay=imx219" "$CONFIG_FILE" 2>/dev/null; then
        echo "dtoverlay=imx219" | sudo tee -a "$CONFIG_FILE"
        echo "gpu_mem=128"      | sudo tee -a "$CONFIG_FILE"
        echo "  → Pi Camera Module 2 (IMX219) $CONFIG_FILE dosyasına eklendi"
    else
        echo "  → Pi Camera Module 2 zaten etkin"
    fi
fi

# ── 4. Ekran yapılandırması (240×320 ILI9341) ─────────────
echo "[4/8] 240x320 ekran yapılandırılıyor..."

if ! grep -q "hdmi_cvt=240 320" "$CONFIG_FILE" 2>/dev/null; then
    sudo tee -a "$CONFIG_FILE" > /dev/null <<'EOFCFG'

# QuickTill ILI9341 ekran (240x320)
hdmi_group=2
hdmi_mode=87
hdmi_cvt=240 320 60 1 0 0 0
hdmi_force_hotplug=1
EOFCFG
    echo "  → Ekran yapılandırması eklendi"
else
    echo "  → Ekran yapılandırması zaten mevcut"
fi

# ── 5. fbcp-ili9341 derleme (HDMI → SPI LCD köprüsü) ──────
echo "[5/8] fbcp-ili9341 derleniyor..."
if [ ! -f /usr/local/bin/fbcp-ili9341 ]; then
    cd /tmp
    [ -d fbcp-ili9341 ] && rm -rf fbcp-ili9341
    git clone https://github.com/juj/fbcp-ili9341.git
    cd fbcp-ili9341
    mkdir build && cd build
    cmake -DILI9341=ON \
          -DGPIO_TFT_DATA_CONTROL=24 \
          -DGPIO_TFT_RESET_PIN=25 \
          -DSPI_BUS_CLOCK_DIVISOR=6 \
          -DBACKLIGHT_CONTROL=ON \
          -DSTATISTICS=0 \
          ..
    make -j$(nproc)
    sudo cp fbcp-ili9341 /usr/local/bin/
    echo "  → fbcp-ili9341 /usr/local/bin/ dizinine kuruldu"
else
    echo "  → fbcp-ili9341 zaten kurulu"
fi

# ── 6. Systemd servisleri ─────────────────────────────────
echo "[6/8] Systemd servisleri kuruluyor..."
CURRENT_USER=$(whoami)

# --- Barkod servisi ---
sudo tee /etc/systemd/system/quicktill-barcode.service > /dev/null <<EOF
[Unit]
Description=QuickTill Barkod Servisi ($BARCODE_MODE modu)
After=network-online.target
Wants=network-online.target

[Service]
User=$CURRENT_USER
WorkingDirectory=$DEVICE_DIR
ExecStart=/usr/bin/python3 $DEVICE_DIR/barcode_service.py --mode $BARCODE_MODE
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# --- fbcp-ili9341 ekran servisi ---
sudo tee /etc/systemd/system/quicktill-display.service > /dev/null <<'EOF'
[Unit]
Description=QuickTill ILI9341 Ekran (fbcp-ili9341)
After=multi-user.target

[Service]
ExecStart=/usr/local/bin/fbcp-ili9341
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

# --- Native pygame kiosk servisi (browser YOK, X11 YOK) ---
PI_APP_DIR="$QUICKTILL_DIR/pi-app"
sudo tee /etc/systemd/system/quicktill-kiosk.service > /dev/null <<EOF
[Unit]
Description=QuickTill Kiosk (pygame native)
After=quicktill-display.service quicktill-barcode.service
Wants=quicktill-display.service quicktill-barcode.service

[Service]
User=$CURRENT_USER
WorkingDirectory=$PI_APP_DIR
Environment=SDL_VIDEODRIVER=fbcon
Environment=SDL_FBDEV=/dev/fb0
Environment=SDL_NOMOUSE=1
ExecStartPre=/bin/sleep 3
ExecStart=/usr/bin/python3 $PI_APP_DIR/app.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable quicktill-display quicktill-barcode quicktill-kiosk
echo "  → Servisler etkinleştirildi"

# ── 7. Konsol otomatik giriş (X11 gerekmez) ──────────────
echo "[7/8] Konsol otomatik giriş ayarlanıyor..."
# pygame fbcon modunda çalışmak için sadece konsol girişi yeterli
sudo raspi-config nonint do_boot_behaviour B2 2>/dev/null || true
echo "  → Konsol otomatik giriş (B2) ayarlandı"

# ── 8. USB barkod okuyucu grubu (evdev erişimi) ───────────
echo "[8/8] USB barkod okuyucu erişim izni ayarlanıyor..."
if [ "$BARCODE_MODE" = "usb" ]; then
    sudo usermod -aG input "$CURRENT_USER" 2>/dev/null || true
    echo "  → '$CURRENT_USER' kullanıcısı 'input' grubuna eklendi"
fi

echo ""
echo "======================================================"
echo " Kurulum tamamlandı!"
echo ""
echo " Sonraki adımlar:"
if [ "$BARCODE_MODE" = "esp32cam" ]; then
echo "   1. device/barcode_service.py içinde ESP32_STREAM_URL'i ayarla"
fi
echo ""
echo "   2. ILI9341 ekranı GPIO'ya bağla (bkz. device/README.md)"
echo ""
echo "   3. Yeniden başlat: sudo reboot"
echo ""
echo "   4. Kontrol et:"
echo "      sudo systemctl status quicktill-kiosk    # pygame uygulaması"
echo "      sudo systemctl status quicktill-barcode  # barkod servisi"
echo "      sudo systemctl status quicktill-display  # fbcp-ili9341"
echo ""
echo "   5. Masaüstünde test (Pi olmadan):"
echo "      python3 pi-app/app.py --dev"
echo "======================================================"
