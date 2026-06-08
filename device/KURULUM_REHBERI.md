# QuickTill Cihaz Kurulum Rehberi
## Raspberry Pi + ILI9341 2.8" SPI LCD Ekran

---

## Gerekli Malzemeler

| Parça | Notlar |
|---|---|
| Raspberry Pi 3B / 4 / 5 | Herhangi bir model çalışır |
| ILI9341 2.8" SPI LCD (240×320) | XPT2046 dokunmatik dahil |
| MicroSD Kart (min. 8 GB) | Class 10 önerilir |
| 5V/3A USB-C güç kaynağı | Pi 4 için zorunlu |
| USB Barkod Okuyucu (opsiyonel) | Plug-and-play, sürücü gerektirmez |
| Pi Camera Modülü 2 (IMX219) | CSI kablosu ile Pi'ye bağlanır |
| Erkek-dişi jumper kablo | ILI9341 GPIO bağlantısı için |

---

## BÖLÜM 1 — Raspberry Pi OS Kurulumu

### 1.1 Raspberry Pi Imager ile MicroSD Hazırlama

1. Bilgisayarında **Raspberry Pi Imager** uygulamasını indir:
   https://www.raspberrypi.com/software/

2. Uygulamayı aç:
   - **Cihaz**: Raspberry Pi 4 (ya da sahip olduğun model)
   - **İşletim Sistemi**: Raspberry Pi OS (32-bit) — **Desktop sürüm seç**
   - **Depolama**: MicroSD kartın

3. ⚙️ **Ayarlar** (dişli simgesi) menüsünü aç ve şunları doldur:
   - ✅ Hostname: `quicktill`
   - ✅ Kullanıcı adı / şifre: `pi` / istediğin şifre
   - ✅ WiFi SSID: Marketin WiFi adı
   - ✅ WiFi Şifre: Marketin WiFi şifresi
   - ✅ SSH: **Etkinleştir**

4. **Yaz** butonuna tıkla ve işlemin bitmesini bekle.

5. MicroSD'yi Pi'ye tak ve güç ver.

---

## BÖLÜM 2 — ILI9341 Ekran GPIO Bağlantıları

Pi'yi kapatmadan **ASLA** GPIO bağlantısı yapma.

### ILI9341 SPI Ekran Bağlantıları

```
ILI9341 Pin   →   Raspberry Pi GPIO (Fiziksel Pin)
────────────────────────────────────────────────────
VCC           →   3.3V         (Pin 1)
GND           →   GND          (Pin 6)
CS            →   GPIO 8 CE0   (Pin 24)
RST           →   GPIO 25      (Pin 22)
DC / RS       →   GPIO 24      (Pin 18)
MOSI / SDI    →   GPIO 10 MOSI (Pin 19)
SCK / CLK     →   GPIO 11 SCLK (Pin 23)
LED / BL      →   3.3V         (Pin 1)
```

### XPT2046 Dokunmatik Bağlantıları

```
Dokunmatik Pin  →   Raspberry Pi GPIO (Fiziksel Pin)
────────────────────────────────────────────────────
T_CLK           →   GPIO 11 SCLK (Pin 23)  — paylaşımlı
T_CS            →   GPIO 7  CE1  (Pin 26)
T_DIN           →   GPIO 10 MOSI (Pin 19)  — paylaşımlı
T_DO            →   GPIO 9  MISO (Pin 21)
T_IRQ           →   GPIO 17      (Pin 11)
```

> **İpucu:** Bazı ILI9341 modüllerinde dokunmatik pinler ayrı etiketlenir (T_CLK, T_CS...). Modülün üzerindeki yazıları dikkatlice kontrol et.

### Raspberry Pi Pin Haritası (Referans)

```
         3.3V → [1]  [2] ← 5V
    SDA GPIO2 → [3]  [4] ← 5V
    SCL GPIO3 → [5]  [6] ← GND
       GPIO4  → [7]  [8] ← GPIO14 TXD
          GND → [9] [10] ← GPIO15 RXD
   T_IRQ GPIO17→[11] [12] ← GPIO18
      GPIO27  →[13] [14] ← GND
      GPIO22  →[15] [16] ← GPIO23
         3.3V →[17] [18] ← GPIO24 ← DC/RS
  MOSI GPIO10 →[19] [20] ← GND
  MISO GPIO9  →[21] [22] ← GPIO25 ← RST
  SCLK GPIO11 →[23] [24] ← GPIO8 CE0 ← CS
          GND →[25] [26] ← GPIO7 CE1 ← T_CS
```

---

## BÖLÜM 3 — Pi'ye SSH ile Bağlanma

Pi WiFi'ye bağlandıktan sonra bilgisayarından bağlan:

```bash
# Mac / Linux terminal:
ssh pi@quicktill.local

# Windows: PuTTY kullan veya PowerShell'de:
ssh pi@quicktill.local
```

Şifre: Raspberry Pi Imager'da ayarladığın şifre.

---

## BÖLÜM 4 — Projeyi Pi'ye Kopyalama

### Seçenek A: Git ile Klonlama (Önerilen)
```bash
cd ~
git clone https://github.com/[KULLANICI_ADIN]/QuickTill.git
cd QuickTill
```

### Seçenek B: USB Flash Bellek
1. QuickTill klasörünü USB belleğe kopyala
2. Pi'ye tak
3. Terminal'de:
```bash
sudo mount /dev/sda1 /mnt
cp -r /mnt/QuickTill ~/QuickTill
```

---

## BÖLÜM 5 — Otomatik Kurulum Script'ini Çalıştırma

### USB Barkod Okuyucu ile (Önerilen — En Kolay)
```bash
cd ~/QuickTill
bash device/setup.sh --barcode-mode usb
```

### Pi Camera Modülü ile
```bash
bash device/setup.sh --barcode-mode picamera
```

### ESP32-CAM ile
```bash
bash device/setup.sh --barcode-mode esp32cam
# Sonra device/barcode_service.py içinde ESP32_STREAM_URL'i düzenle
```

> **Not:** Derleme (fbcp-ili9341) 10-15 dakika sürebilir. Sabırlı ol.

---

## BÖLÜM 6 — WiFi Ayarı

```bash
# Market WiFi'sine bağlan:
sudo raspi-config
```

**Network Options → Wireless LAN** → SSID ve şifreyi gir.

Ya da direkt:
```bash
sudo nmcli device wifi connect "MARKET_WIFI_ADI" password "WIFI_SIFRE"
```

---

## BÖLÜM 7 — Yeniden Başlatma ve Test

```bash
sudo reboot
```

Yeniden başlatma sonrası (~1 dakika bekle), ILI9341 ekranı üzerinde QuickTill uygulaması açılmış olmalı.

### Servis Durumlarını Kontrol Etme
```bash
# Ekran servisi
sudo systemctl status quicktill-display

# Barkod servisi
sudo systemctl status quicktill-barcode

# Tarayıcı (kiosk)
sudo systemctl status quicktill-kiosk
```

---

## BÖLÜM 8 — Dokunmatik Ekran Kalibrasyonu

Dokunma noktaları kaymış görünüyorsa:

```bash
# Kalibrasyon aracını kur
sudo apt install -y xinput-calibrator

# Kalibrasyonu başlat (masaüstünde çalıştır)
DISPLAY=:0 xinput_calibrator
```

Ekrandaki 4 noktaya sırayla dokun. Verilen değerleri `/etc/X11/xorg.conf.d/99-calibration.conf` dosyasına yaz:

```bash
sudo mkdir -p /etc/X11/xorg.conf.d/
sudo tee /etc/X11/xorg.conf.d/99-calibration.conf > /dev/null <<EOF
Section "InputClass"
    Identifier "calibration"
    MatchProduct "ADS7846 Touchscreen"
    Option "Calibration" "DEGERLERI_BURAYA_YAZ"
    Option "SwapAxes" "0"
EndSection
EOF
```

---

## BÖLÜM 9 — Barkod Okuyucu Testi

### USB Barkod Okuyucu
```bash
# Cihazın görünüp görünmediğini kontrol et
ls /dev/input/event*
python3 ~/QuickTill/device/barcode_service.py --mode usb
# Barkod okutunca: [barcode] Tespit edildi: 8690123456789
```

### Pi Camera Module 2
```bash
# CSI kablosunun doğru takılı olduğundan emin ol (mavi şerit dışa bakmalı)

# Kameranın algılanıp algılanmadığını kontrol et
libcamera-hello --timeout 2000
# → Kameradan görüntü penceresi açılmalı

# Barkod servisini başlat
python3 ~/QuickTill/device/barcode_service.py --mode picamera
# → Barkod okutunca: [barcode] Tespit edildi: 8690123456789
```

> **Not:** Pi Camera Module 2 odak sabitlenmiş (fixed-focus) değildir. Barkod okuma mesafesi için kamerayı ~15-20 cm uzağa konumlandır.

---

## BÖLÜM 10 — Servis Loglarını İzleme

```bash
# Canlı log akışı
journalctl -u quicktill-kiosk -f
journalctl -u quicktill-barcode -f
journalctl -u quicktill-display -f
```

---

## Sorun Giderme

| Sorun | Çözüm |
|---|---|
| Ekran yanmıyor | GPIO bağlantılarını kontrol et; `sudo systemctl status quicktill-display` |
| Ekran görüntüsü bozuk / renkler yanlış | `/boot/config.txt`'deki `hdmi_cvt` satırını kontrol et |
| fbcp-ili9341 crash | SPI etkin mi? `lsmod | grep spi` |
| Tarayıcı açılmıyor | `DISPLAY=:0 chromium-browser` ile manual test et |
| WiFi'ye bağlanamıyor | `sudo nmcli device wifi list` ile ağları listele |
| USB barkod okuyucu çalışmıyor | `ls /dev/input/` — `sudo usermod -aG input pi && sudo reboot` |
| Pi Camera bulunamıyor | `vcgencmd get_camera` → `supported=1 detected=1` görünmeli |
| Dokunma noktaları kaymış | BÖLÜM 8'deki kalibrasyonu uygula |

---

## Mimari Özeti

```
┌─────────────────────────────────────────────────┐
│              Raspberry Pi                        │
│                                                  │
│  [fbcp-ili9341] ──── HDMI framebuffer'ı          │
│       │               ILI9341 SPI'a yansıtır    │
│       ▼                                          │
│  ILI9341 Ekran (240×320)  ◄── XPT2046 Dokunmatik│
│                                                  │
│  [Chromium Kiosk] ──── quick-till-one.vercel.app │
│       │               (Market WiFi üzerinden)    │
│       ▼                                          │
│  [barcode_service.py] ── WebSocket :8765         │
│       │                                          │
│       ├── usb: /dev/input/event* (USB okuyucu)   │
│       ├── picamera: Pi Camera v1/v2/v3           │
│       └── esp32cam: MJPEG stream                 │
└─────────────────────────────────────────────────┘
```

---

*Herhangi bir adımda takılırsan hata mesajını kopyalayıp paylaş.*
