#!/bin/bash
# ============================================================
#  QuickTill Device Setup Script — Raspberry Pi 4
#  Run once after a fresh Raspberry Pi OS install
#  Usage: bash setup.sh
# ============================================================
set -e

QUICKTILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEVICE_DIR="$QUICKTILL_DIR/device"

echo "======================================================"
echo " QuickTill Device Setup"
echo " Project: $QUICKTILL_DIR"
echo "======================================================"

# ── 1. System packages ────────────────────────────────────
echo "[1/7] Installing system packages..."
sudo apt-get update -y
sudo apt-get install -y \
    python3-pip \
    libzbar0 \
    cmake \
    git \
    chromium-browser \
    unclutter \
    xdotool \
    tslib \
    evtest \
    xinput

# ── 2. Python packages ────────────────────────────────────
echo "[2/7] Installing Python packages..."
pip3 install --break-system-packages \
    pyzbar \
    opencv-python-headless \
    websockets \
    numpy

# ── 3. Enable SPI ─────────────────────────────────────────
echo "[3/7] Enabling SPI interface..."
if ! grep -q "^dtparam=spi=on" /boot/config.txt 2>/dev/null && \
   ! grep -q "^dtparam=spi=on" /boot/firmware/config.txt 2>/dev/null; then
    CONFIG_FILE="/boot/firmware/config.txt"
    [ -f /boot/config.txt ] && CONFIG_FILE="/boot/config.txt"
    echo "dtparam=spi=on" | sudo tee -a "$CONFIG_FILE"
    echo "  → SPI enabled in $CONFIG_FILE"
else
    echo "  → SPI already enabled"
fi

# ── 4. Display config (240×320 for ILI9341) ───────────────
echo "[4/7] Configuring 240x320 display output..."
CONFIG_FILE="/boot/firmware/config.txt"
[ -f /boot/config.txt ] && CONFIG_FILE="/boot/config.txt"

if ! grep -q "hdmi_cvt=240 320" "$CONFIG_FILE" 2>/dev/null; then
    sudo tee -a "$CONFIG_FILE" > /dev/null <<'EOF'

# QuickTill ILI9341 display (240x320)
hdmi_group=2
hdmi_mode=87
hdmi_cvt=240 320 60 1 0 0 0
hdmi_force_hotplug=1
EOF
    echo "  → Display config added"
else
    echo "  → Display config already present"
fi

# ── 5. fbcp-ili9341 (framebuffer → SPI LCD) ───────────────
echo "[5/7] Building fbcp-ili9341..."
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
    make -j4
    sudo cp fbcp-ili9341 /usr/local/bin/
    echo "  → fbcp-ili9341 installed to /usr/local/bin/"
else
    echo "  → fbcp-ili9341 already installed"
fi

# ── 6. Systemd services ────────────────────────────────────
echo "[6/7] Installing systemd services..."
CURRENT_USER=$(whoami)

# barcode service
sudo tee /etc/systemd/system/quicktill-barcode.service > /dev/null <<EOF
[Unit]
Description=QuickTill Barcode Service (ESP32-CAM → WebSocket)
After=network-online.target
Wants=network-online.target

[Service]
User=$CURRENT_USER
WorkingDirectory=$DEVICE_DIR
ExecStart=/usr/bin/python3 $DEVICE_DIR/barcode_service.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# fbcp-ili9341 display service
sudo tee /etc/systemd/system/quicktill-display.service > /dev/null <<'EOF'
[Unit]
Description=QuickTill ILI9341 Display (fbcp-ili9341)
After=multi-user.target

[Service]
ExecStart=/usr/local/bin/fbcp-ili9341
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

# kiosk browser service
sudo tee /etc/systemd/system/quicktill-kiosk.service > /dev/null <<EOF
[Unit]
Description=QuickTill Kiosk Browser
After=quicktill-display.service graphical.target
Requires=graphical.target

[Service]
User=$CURRENT_USER
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/$CURRENT_USER/.Xauthority
ExecStartPre=/bin/sleep 5
ExecStart=/usr/bin/chromium-browser \\
    --kiosk \\
    --no-sandbox \\
    --disable-infobars \\
    --disable-session-crashed-bubble \\
    --disable-restore-session-state \\
    --noerrdialogs \\
    --window-size=240,320 \\
    --window-position=0,0 \\
    https://quick-till-one.vercel.app
Restart=always
RestartSec=10

[Install]
WantedBy=graphical.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable quicktill-display quicktill-barcode quicktill-kiosk
echo "  → Services enabled"

# ── 7. Auto-login and hide cursor ─────────────────────────
echo "[7/7] Configuring auto-login and kiosk tweaks..."
# Hide mouse cursor when idle
if ! grep -q "unclutter" /etc/xdg/lxsession/LXDE-pi/autostart 2>/dev/null; then
    echo "@unclutter -idle 0.5 -root" | sudo tee -a /etc/xdg/lxsession/LXDE-pi/autostart || true
fi

echo ""
echo "======================================================"
echo " Setup complete!"
echo ""
echo " Next steps:"
echo "   1. Edit device/barcode_service.py"
echo "      → Set ESP32_STREAM_URL to your ESP32-CAM IP"
echo ""
echo "   2. Wire ILI9341 to GPIO (see README.md for pinout)"
echo ""
echo "   3. Flash ESP32-CAM with CameraWebServer example"
echo "      (Arduino IDE → Examples → ESP32 → Camera)"
echo ""
echo "   4. Reboot: sudo reboot"
echo ""
echo "   5. After reboot, test barcode service:"
echo "      sudo systemctl status quicktill-barcode"
echo "      python3 device/barcode_service.py  (manual test)"
echo "======================================================"
