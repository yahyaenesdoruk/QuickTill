# QuickTill Hardware Device

## Donanım

| Parça | Kullanım |
|---|---|
| Raspberry Pi 4 | Ana bilgisayar |
| ILI9341 2.8" SPI LCD (240×320) | Ekran |
| ESP32-CAM + OV2640 | Barkod tarayıcı |

## GPIO Bağlantıları

### ILI9341 SPI Ekran
```
ILI9341 Pin  →  RPi GPIO (Fiziksel Pin)
─────────────────────────────────────────
VCC          →  3.3V        (Pin 1)
GND          →  GND         (Pin 6)
CS           →  GPIO8 CE0   (Pin 24)
RST          →  GPIO25      (Pin 22)
DC/RS        →  GPIO24      (Pin 18)
MOSI/SDI     →  GPIO10 MOSI (Pin 19)
SCK/CLK      →  GPIO11 SCLK (Pin 23)
LED/BL       →  3.3V        (Pin 1)  veya GPIO ile dim kontrol
```

### XPT2046 Dokunmatik (ILI9341 üzerinde)
```
T_CLK        →  GPIO11 SCLK (Pin 23)  — paylaşımlı
T_CS         →  GPIO7  CE1  (Pin 26)
T_DIN        →  GPIO10 MOSI (Pin 19)  — paylaşımlı
T_DO         →  GPIO9  MISO (Pin 21)
T_IRQ        →  GPIO17      (Pin 11)
```

## Kurulum

### 1. Raspberry Pi OS Yükle
- Raspberry Pi Imager → Raspberry Pi OS (32-bit veya 64-bit Desktop)
- MicroSD karta yaz, Pi'ye tak, boot et

### 2. Setup Script Çalıştır
```bash
cd ~/QuickTill
bash device/setup.sh
```

Script şunları yapar:
- System paketlerini yükler (libzbar0, cmake, chromium, vb.)
- Python paketlerini yükler (pyzbar, opencv, websockets)
- SPI'ı aktif eder
- 240×320 display modunu ayarlar
- fbcp-ili9341'i derler ve yükler
- Systemd servislerini kurar

### 3. ESP32-CAM Firmware
1. Arduino IDE'yi aç
2. **File → Examples → ESP32 → Camera → CameraWebServer**
3. `camera_pins.h`'da `#define CAMERA_MODEL_AI_THINKER` sat ırını aç, diğerlerini kapat
4. `CameraWebServer.ino`'da WiFi bilgilerini gir:
   ```cpp
   const char* ssid = "WİFİ_ADINIZ";
   const char* password = "WİFİ_ŞİFRENİZ";
   ```
5. Upload et
6. Serial Monitor'ı aç (115200 baud) → IP adresini not al
7. Tarayıcıda `http://[IP_ADRESİ]/stream` test et — video görünmeli

### 4. Barcode Service Ayarla
```bash
# device/barcode_service.py içinde:
ESP32_STREAM_URL = "http://[ESP32_IP_ADRESINIZ]/stream"
```

### 5. Yeniden Başlat
```bash
sudo reboot
```

### 6. Dokunmatik Ekran Kalibrasyonu (Opsiyonel)
```bash
sudo TSLIB_FBDEVICE=/dev/fb1 TSLIB_TSDEVICE=/dev/input/event0 ts_calibrate
```

## Test

```bash
# 1. ESP32-CAM stream testi
curl http://[ESP32_IP]/stream | head -c 100

# 2. Barcode servis manuel test
python3 device/barcode_service.py
# Barkod okutunca terminalde görünmeli: [barcode] Detected: 8690123456789

# 3. WebSocket testi
# Ayrı bir terminalde:
pip3 install websocket-client
python3 -c "
import websocket, time
ws = websocket.WebSocket()
ws.connect('ws://localhost:8765')
print('Connected! Waiting for barcodes...')
while True: print(ws.recv())
"

# 4. Servis durumları
sudo systemctl status quicktill-display
sudo systemctl status quicktill-barcode
sudo systemctl status quicktill-kiosk
```

## Mimari

```
ESP32-CAM (OV2640)
    │  MJPEG stream (HTTP :80/stream)
    ▼
barcode_service.py (Python, Raspberry Pi)
    │  pyzbar decode EAN-13/QR
    │  WebSocket broadcast (:8765)
    ▼
Chromium Browser (kiosk mode, 240×320)
    │  WebSocket client
    ▼
QuickTill App → HardwareScannerTab → handleCode() → sepete ekle
```

## Sorun Giderme

| Sorun | Çözüm |
|---|---|
| ILI9341 ekran yanmıyor | GPIO bağlantılarını kontrol et, SPI aktif mi? |
| fbcp-ili9341 crash | `/boot/config.txt`'de display modunu kontrol et |
| ESP32-CAM bağlanmıyor | Aynı WiFi ağında mı? IP doğru mu? |
| Barkod okunmuyor | Işık yeterli mi? Kamera odaklanmış mı? |
| WebSocket bağlanmıyor | `barcode_service.py` çalışıyor mu? |
