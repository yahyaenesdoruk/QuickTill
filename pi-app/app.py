#!/usr/bin/env python3
"""
QuickTill Pi Kiosk — Native pygame uygulaması
==============================================
Chrome veya X11 gerekmez. luma.lcd ile ILI9341 SPI ekrana doğrudan çizer.
240×320 ILI9341 SPI ekran + XPT2046 dokunmatik için.

Kullanım:
  python3 app.py            → Pi'de (luma.lcd + ILI9341)
  python3 app.py --dev      → Masaüstünde test (normal pencere)

Bağımlılıklar:
  pip3 install pygame requests websockets evdev luma.lcd luma.core --break-system-packages
"""

import os, sys, threading, time, json, queue
import pygame
import requests

# ── Ortam — offscreen modu (luma.lcd doğrudan SPI'a yazar) ───────────────────
DEV = '--dev' in sys.argv
if not DEV:
    os.environ['SDL_VIDEODRIVER'] = 'offscreen'
    os.environ['SDL_NOMOUSE']     = '1'

# ── Sabitler ──────────────────────────────────────────────────────────────────
W, H   = 240, 320
FPS    = 30 if DEV else 20   # Pi'de SPI transfer hızına göre 20fps
API    = 'https://quicktill-backend.onrender.com/api'
WS_URL = 'ws://localhost:8765'

# Renkler (web uygulamasıyla aynı palet)
P      = ( 37,  99, 235)   # primary blue
SU     = ( 22, 163,  74)   # success green
ER     = (220,  38,  38)   # error red
BG     = (241, 245, 249)   # surface
WH     = (255, 255, 255)   # white
TX     = ( 15,  23,  42)   # text dark
T2     = (100, 116, 139)   # text secondary
BD     = (226, 232, 240)   # border
OK_BG  = (240, 253, 244)
OK_BD  = (134, 239, 172)
NO_BG  = (255, 245, 245)
NO_BD  = (252, 165, 165)

# ── pygame Init ───────────────────────────────────────────────────────────────
pygame.init()
screen = pygame.display.set_mode((W, H))
pygame.display.set_caption('QuickTill')
clock  = pygame.time.Clock()
if not DEV:
    pygame.mouse.set_visible(False)

# ── luma.lcd ILI9341 (yalnızca Pi modunda) ────────────────────────────────────
_disp  = None
_Image = None
if not DEV:
    try:
        from luma.lcd.device import ili9341 as _ILI9341
        from luma.core.interface.serial import spi as _SPI
        from PIL import Image as _Image
        import lgpio as _lgpio

        class _GpioAdapter:
            """RPi.GPIO uyumlu lgpio sarmalayıcısı (luma.core için)."""
            BCM = 11; OUT = 0; IN = 1; HIGH = 1; LOW = 0
            def __init__(self):
                self._h = None; self._pins = []
            def setmode(self, _m):
                self._h = _lgpio.gpiochip_open(0)
            def setup(self, pin, _d):
                _lgpio.gpio_claim_output(self._h, pin); self._pins.append(pin)
            def output(self, pin, val):
                _lgpio.gpio_write(self._h, pin, int(val))
            def cleanup(self):
                for p in self._pins: _lgpio.gpio_free(self._h, p)
                if self._h is not None: _lgpio.gpiochip_close(self._h)

        _serial = _SPI(port=0, device=0, gpio_DC=24, gpio_RST=25,
                       bus_speed_hz=32000000, gpio_BACKLIGHT=None,
                       gpio=_GpioAdapter())
        _disp = _ILI9341(_serial, width=240, height=320, rotate=0, bgr=False)
        print('[display] ILI9341 hazir')
    except Exception as _e:
        print(f'[display] HATA: {_e}')

def _font(size, bold=False):
    for name in ['DejaVuSans', 'DejaVu Sans', 'FreeSans', None]:
        try:
            f = pygame.font.SysFont(name, size, bold=bold) if name else pygame.font.Font(None, size + 4)
            return f
        except Exception:
            continue
    return pygame.font.Font(None, size + 4)

F11  = _font(11);  F12  = _font(12);  F13  = _font(13)
F16  = _font(16);  F20  = _font(20)
F12B = _font(12, True);  F13B = _font(13, True)
F14B = _font(14, True);  F15B = _font(15, True)

# ── State ─────────────────────────────────────────────────────────────────────
cart           = []               # [{barcode, name, price, qty}]
screen_name    = 'cart'           # 'cart' | 'scanner' | 'checkout'
ws_status      = 'connecting'     # 'connecting' | 'ready' | 'error'
scan_result    = None             # None | {'ok', 'product'/'code'}
toast_data     = None             # (text, color, expire_time)
api_busy       = False
kbd_text       = ''               # manual barcode input
kbd_active     = False
cart_scroll    = 0
co_scroll      = 0
event_queue    = queue.Queue()    # thread → main thread
pi_user        = None             # None | {'id', 'name', 'email', 'username'}
pi_token       = None             # Giriş yapılmış kullanıcının JWT'si

# ── Cart helpers ──────────────────────────────────────────────────────────────
def cart_add(product):
    for item in cart:
        if item['barcode'] == product['barcode']:
            item['qty'] += 1
            return
    cart.append({'barcode': product['barcode'], 'name': product['name'],
                 'price': float(product['price']), 'qty': 1})

def cart_update(barcode, delta):
    global cart
    for item in cart:
        if item['barcode'] == barcode:
            item['qty'] = max(0, item['qty'] + delta)
    cart[:] = [i for i in cart if i['qty'] > 0]

def cart_total(): return sum(i['price'] * i['qty'] for i in cart)
def cart_count(): return sum(i['qty'] for i in cart)

# ── API (arka plan) ───────────────────────────────────────────────────────────
def _lookup(code):
    try:
        r = requests.get(f'{API}/products/barcode/{code}', timeout=10)
        if r.status_code == 404:
            event_queue.put({'t': 'result', 'ok': False, 'code': code})
        elif r.ok:
            event_queue.put({'t': 'result', 'ok': True, 'product': r.json(), 'code': code})
        else:
            event_queue.put({'t': 'result', 'ok': False, 'code': code})
    except Exception:
        event_queue.put({'t': 'result', 'ok': False, 'code': code, 'net': True})

def lookup(code):
    global api_busy
    if api_busy:
        return
    api_busy = True
    threading.Thread(target=_lookup, args=(code,), daemon=True).start()

# ── QR Link Token (arka plan) ─────────────────────────────────────────────────
def _redeem_link_token(token):
    try:
        r = requests.post(f'{API}/auth/redeem-link-token',
                          json={'token': token}, timeout=10)
        if r.ok:
            data = r.json()
            event_queue.put({'t': 'link_ok', 'user': data['user'], 'token': data['token']})
        else:
            try:
                msg = r.json().get('detail', 'Giris hatasi')
            except Exception:
                msg = 'Giris hatasi'
            event_queue.put({'t': 'link_fail', 'msg': msg})
    except Exception:
        event_queue.put({'t': 'link_fail', 'msg': 'Baglanti hatasi'})

def redeem_link_token(token):
    threading.Thread(target=_redeem_link_token, args=(token,), daemon=True).start()

# ── Fiş kaydetme (arka plan) ──────────────────────────────────────────────────
def _save_receipt(items_snapshot, token):
    """Ödeme sonrası fişi backend'e kaydeder."""
    from datetime import datetime as _dt
    now = _dt.now()
    ts  = str(int(now.timestamp() * 1000))
    receipt_id = f"#RCP-{now.strftime('%Y%m%d')}-{ts[-4:]}"
    payload = {
        'receiptId':     receipt_id,
        'date':          now.strftime('%d.%m.%Y'),
        'time':          now.strftime('%H:%M'),
        'items':         [
            {
                'name':      i['name'],
                'quantity':  i['qty'],
                'unitPrice': i['price'],
                'subtotal':  round(i['price'] * i['qty'], 2),
            }
            for i in items_snapshot
        ],
        'total':         round(sum(i['price'] * i['qty'] for i in items_snapshot), 2),
        'itemCount':     sum(i['qty'] for i in items_snapshot),
        'paymentMethod': 'Pi',
    }
    try:
        r = requests.post(
            f'{API}/receipts',
            json=payload,
            headers={'Authorization': f'Bearer {token}'},
            timeout=15,
        )
        if r.ok:
            event_queue.put({'t': 'receipt_ok'})
        else:
            event_queue.put({'t': 'receipt_fail'})
    except Exception:
        event_queue.put({'t': 'receipt_fail'})

# ── WebSocket barkod servisi (arka plan) ──────────────────────────────────────
def _ws_loop():
    global ws_status
    import asyncio, websockets as _ws

    async def _run():
        global ws_status
        while True:
            try:
                ws_status = 'connecting'
                async with _ws.connect(WS_URL, open_timeout=5) as conn:
                    ws_status = 'ready'
                    async for raw in conn:
                        try:
                            d = json.loads(raw)
                            if d.get('barcode'):
                                event_queue.put({'t': 'barcode', 'code': d['barcode']})
                        except Exception:
                            pass
            except Exception:
                ws_status = 'error'
                await asyncio.sleep(5)

    asyncio.run(_run())

threading.Thread(target=_ws_loop, daemon=True).start()

# ── Dokunmatik (evdev — XPT2046 / ads7846) ───────────────────────────────────
def _touch_loop():
    """
    XPT2046 dokunmatik olaylarını okuyup pygame'e iletir.
    Sadece Pi'de çalışır; masaüstü testinde yoksayılır.
    """
    try:
        import evdev
        from evdev import ecodes as EC
    except ImportError:
        return

    def find_touch():
        for path in evdev.list_devices():
            try:
                dev = evdev.InputDevice(path)
                caps = dev.capabilities()
                if EC.EV_ABS in caps:
                    return dev
            except Exception:
                pass
        return None

    dev = find_touch()
    if not dev:
        return

    ai_x = dev.absinfo(EC.ABS_X)
    ai_y = dev.absinfo(EC.ABS_Y)
    tx = ty = 0

    for ev in dev.read_loop():
        if ev.type == EC.EV_ABS:
            if ev.code == EC.ABS_X:
                tx = int((ev.value - ai_x.min) / max(ai_x.max - ai_x.min, 1) * W)
            elif ev.code == EC.ABS_Y:
                ty = int((ev.value - ai_y.min) / max(ai_y.max - ai_y.min, 1) * H)
        elif ev.type == EC.EV_KEY and ev.code == EC.BTN_TOUCH:
            kind = pygame.MOUSEBUTTONDOWN if ev.value else pygame.MOUSEBUTTONUP
            pygame.event.post(pygame.event.Event(kind, {'pos': (tx, ty), 'button': 1}))

if not DEV:
    threading.Thread(target=_touch_loop, daemon=True).start()

# ── Çizim yardımcıları ────────────────────────────────────────────────────────
def fill_rect(color, rect, r=0):
    pygame.draw.rect(screen, color, rect, border_radius=r)

def stroke_rect(color, rect, w=1, r=0):
    pygame.draw.rect(screen, color, rect, w, border_radius=r)

def text(txt, font, color, x, y, anchor='left', max_w=0):
    s = txt
    if max_w:
        while font.size(s)[0] > max_w and len(s) > 1:
            s = s[:-2] + '…'
    surf = font.render(str(s), True, color)
    if   anchor == 'center': x -= surf.get_width() // 2
    elif anchor == 'right':  x -= surf.get_width()
    screen.blit(surf, (x, y))

def button(label, rect, bg, fg=WH, r=9):
    fill_rect(bg, rect, r)
    surf = F13B.render(label, True, fg)
    screen.blit(surf, (rect[0] + rect[2]//2 - surf.get_width()//2,
                       rect[1] + rect[3]//2 - surf.get_height()//2))

def hit(rect, pos):
    return pygame.Rect(rect).collidepoint(pos)

def toast(msg, color=SU, sec=2.3):
    global toast_data
    toast_data = (msg, color, time.time() + sec)

# ── Ekran: SEPET ──────────────────────────────────────────────────────────────
HDR = 44          # header yüksekliği
FTR = 100         # footer yüksekliği
LST_Y = HDR
LST_H = H - HDR - FTR   # 176px — liste alanı
ITM_H = 46        # her sepet kalemi yüksekliği

def _cart_items_y():
    """Kaydırılmış liste Y konumları + buton rect'leri listesi döner."""
    regions = []
    y = LST_Y + 6 - cart_scroll
    for item in cart:
        bx = W - 12        # sağ kenar
        bx -= 36           # toplam metin genişliği
        plus_x  = bx - 4 - 24
        num_x   = plus_x - 18
        minus_x = num_x  - 24 - 2
        regions.append({
            'barcode': item['barcode'],
            'y':       y,
            'plus':    (plus_x, y + 11, 24, 24),
            'minus':   (minus_x, y + 11, 24, 24),
        })
        y += ITM_H
    return regions

def draw_cart():
    screen.fill(BG)

    # ── Header
    fill_rect(WH, (0, 0, W, HDR))
    pygame.draw.line(screen, BD, (0, HDR), (W, HDR), 1)
    if pi_user:
        # Kullanıcı avatarı (renkli daire + baş harf)
        pygame.draw.circle(screen, P, (18, HDR // 2), 12)
        ini = (pi_user['name'][0].upper() if pi_user.get('name') else '?')
        text(ini, F12B, WH, 18, HDR // 2 - 6, 'center')
        # İsim
        first = pi_user['name'].split()[0] if pi_user.get('name') else ''
        text(first, F13B, TX, 34, 14, max_w=78)
        # Çıkış butonu
        fill_rect(NO_BG, USER_LOGOUT_BTN, 8)
        stroke_rect(ER, USER_LOGOUT_BTN, 1, 8)
        text('x Cikis', F11, ER,
             USER_LOGOUT_BTN[0] + USER_LOGOUT_BTN[2] // 2,
             USER_LOGOUT_BTN[1] + 5, 'center')
    else:
        text('QuickTill', F15B, TX, 12, 13)
    fill_rect(P, (W-42, 5, 34, 34), 17)
    text('+', F14B, WH, W-25, 13, 'center')

    # ── Liste (kırpmalı)
    screen.set_clip(pygame.Rect(0, LST_Y, W, LST_H))
    if not cart:
        text('Sepet bos', F13B, T2, W//2, LST_Y + 68, 'center')
        text('Barkod tarayarak urun ekleyin', F11, T2, W//2, LST_Y + 88, 'center')
    else:
        max_s = max(0, len(cart) * ITM_H - LST_H)
        global cart_scroll
        cart_scroll = max(0, min(cart_scroll, max_s))
        for item, reg in zip(cart, _cart_items_y()):
            y = reg['y']
            if y + ITM_H < LST_Y - 2 or y > LST_Y + LST_H + 2:
                continue
            fill_rect(WH, (6, y, W-12, ITM_H-4), 8)
            text(item['name'], F13B, TX, 12, y + 6, max_w=108)
            text(f"{item['price']:.2f} TL/ad", F11, T2, 12, y + 23)
            # Toplam
            tot_x = W - 12
            text(f"{item['price']*item['qty']:.2f}TL", F12B, P, tot_x, y + 15, 'right')
            # + butonu
            fill_rect(WH, reg['plus'],  6); stroke_rect(P, reg['plus'],  1, 6)
            text('+', F14B, P,  reg['plus'][0]  + 12, reg['plus'][1]  + 4, 'center')
            # adet
            text(str(item['qty']), F13B, TX, reg['minus'][0] - 4 + 14, y + 15, 'center')
            # - butonu
            fill_rect(WH, reg['minus'], 6); stroke_rect(ER, reg['minus'], 1, 6)
            text('-', F14B, ER, reg['minus'][0] + 12, reg['minus'][1] + 4, 'center')
    screen.set_clip(None)

    # ── Footer
    fy = H - FTR
    pygame.draw.line(screen, BD, (0, fy), (W, fy), 1)
    fill_rect(WH, (0, fy, W, FTR))
    text(f'{cart_count()} urun', F12, T2, 10, fy + 8)
    text(f'{cart_total():.2f} TL', F20, P, W-10, fy + 4, 'right')
    button('Barkod Tara',  (8, fy + 32, W-16, 28), P)
    button('Odeme Yap',    (8, fy + 64, W-16, 28), SU)

CART_SCAN_BTN    = (W-42, 5,  34, 34)
CART_SCAN_ACT    = (8, H-FTR+32, W-16, 28)
CART_PAY_ACT     = (8, H-FTR+64, W-16, 28)
USER_LOGOUT_BTN  = (116, 10, 58, 24)   # header'da "× Çıkış" butonu

# ── Ekran: TARAYICI ───────────────────────────────────────────────────────────
BACK_BTN  = (0, 0, 44, HDR)
RETRY_BTN = (W//2 - 44, 148, 88, 26)
MANUAL_IN = (10, 252, W-56, 34)
MANUAL_GO = (W-44, 252, 36, 34)

def draw_scanner():
    screen.fill(BG)

    # ── Header
    fill_rect(WH, (0, 0, W, HDR))
    pygame.draw.line(screen, BD, (0, HDR), (W, HDR), 1)
    text('<', F14B, P, 10, 14)
    text('Barkod Tara', F15B, TX, W//2, 14, 'center')

    # ── Durum kartı
    fill_rect(WH, (8, 52, W-16, 90), 10)
    if ws_status == 'ready':
        text('Cihaz Hazir', F14B, TX, W//2, 66, 'center')
        pygame.draw.circle(screen, SU, (W//2 - 44, 98), 4)
        text('Barkodu okutun', F12, T2, W//2 - 36, 92)
    elif ws_status == 'connecting':
        text('Baglaniliyor...', F14B, TX, W//2, 66, 'center')
        text('Barkod servisi bekleniyor', F11, T2, W//2, 94, 'center')
    else:
        text('Baglanti Yok', F14B, ER, W//2, 66, 'center')
        text('Manuel giris yapabilirsiniz', F11, T2, W//2, 88, 'center')
        button('Tekrar Dene', RETRY_BTN, P)

    # ── Tarama sonucu
    if scan_result:
        if scan_result['ok']:
            p = scan_result['product']
            fill_rect(OK_BG, (8, 150, W-16, 60), 8)
            stroke_rect(OK_BD, (8, 150, W-16, 60), 1, 8)
            text(p['name'], F13B, TX, 14, 157, max_w=W-28)
            text(f"{p['price']:.2f} TL", F16, SU, 14, 175)
            qty = next((i['qty'] for i in cart if i['barcode'] == p['barcode']), 0)
            if qty:
                text(f'Sepette: {qty} adet', F11, T2, W-14, 176, 'right')
        else:
            fill_rect(NO_BG, (8, 150, W-16, 42), 8)
            stroke_rect(NO_BD, (8, 150, W-16, 42), 1, 8)
            text('Urun bulunamadi', F13B, ER, W//2, 157, 'center')
            text(str(scan_result.get('code', '')), F11, T2, W//2, 175, 'center')

    # ── Manuel giriş
    my = 236
    fill_rect(WH, (8, my, W-16, 64), 8)
    text('Manuel Giris', F12, T2, 14, my + 8)
    box_c = P if kbd_active else BD
    fill_rect(WH, MANUAL_IN, 7); stroke_rect(box_c, MANUAL_IN, 2, 7)
    disp = kbd_text if kbd_text else '8691234567890'
    col  = TX if kbd_text else T2
    text(disp, F13, col, MANUAL_IN[0]+8, MANUAL_IN[1]+9, max_w=MANUAL_IN[2]-12)
    fill_rect(P, MANUAL_GO, 7)
    text('>', F14B, WH, MANUAL_GO[0]+18, MANUAL_GO[1]+9, 'center')

# ── Ekran: ÖDEME ──────────────────────────────────────────────────────────────
CONFIRM_BTN = (8, H-70, W-16, 32)
BACK_CO_BTN = (8, H-34, W-16, 26)

def draw_checkout():
    screen.fill(BG)

    # ── Header
    fill_rect(WH, (0, 0, W, HDR))
    pygame.draw.line(screen, BD, (0, HDR), (W, HDR), 1)
    text('<', F14B, P, 10, 14)
    text('Odeme', F15B, TX, W//2, 14, 'center')

    # ── Kalemler
    screen.set_clip(pygame.Rect(0, HDR, W, H - HDR - 78))
    y = HDR + 8 - co_scroll
    for item in cart:
        pygame.draw.line(screen, BD, (10, y+24), (W-10, y+24), 1)
        text(f"{item['name']} x{item['qty']}", F12, TX, 10, y+6, max_w=145)
        text(f"{item['price']*item['qty']:.2f} TL", F12, T2, W-10, y+6, 'right')
        y += 28
    # Toplam
    fill_rect(BG, (0, y, W, 32))
    pygame.draw.line(screen, BD, (8, y+2), (W-8, y+2), 1)
    text('Toplam', F13B, TX, 10, y+10)
    text(f'{cart_total():.2f} TL', F20, P, W-10, y+6, 'right')
    screen.set_clip(None)

    # ── Footer
    button('Odemeyi Onayla', CONFIRM_BTN, SU)
    fill_rect(WH, BACK_CO_BTN, 8); stroke_rect(P, BACK_CO_BTN, 1, 8)
    button('< Geri', BACK_CO_BTN, WH, P)

# ── Toast çizimi ──────────────────────────────────────────────────────────────
def draw_toast():
    if not toast_data:
        return
    msg, color, exp = toast_data
    if time.time() > exp:
        return
    surf = F12B.render(msg, True, WH)
    tw = surf.get_width() + 18
    tx_ = (W - tw) // 2
    fill_rect(color, (tx_, H-28, tw, 20), 7)
    screen.blit(surf, (tx_+9, H-24))

# ── Ekran geçişi ──────────────────────────────────────────────────────────────
def go(name):
    global screen_name, scan_result, kbd_text, kbd_active, cart_scroll, co_scroll
    screen_name = name
    if name == 'scanner':
        scan_result = None; kbd_text = ''; kbd_active = False
    if name == 'cart':
        cart_scroll = 0
    if name == 'checkout':
        co_scroll = 0
        if not cart:
            toast('Sepet bos!', ER); screen_name = 'cart'

# ── Ana döngü ─────────────────────────────────────────────────────────────────
drag_start = None
drag_scroll_start = 0
dragging   = False

running = True
while running:

    # ── Arka plan mesajları
    while not event_queue.empty():
        m = event_queue.get_nowait()
        if m['t'] == 'barcode':
            code = m['code']
            if code.startswith('QTLINK:'):
                # QR hesap bağlama token'ı
                redeem_link_token(code[len('QTLINK:'):])
                go('cart')
            else:
                lookup(code)
        elif m['t'] == 'result':
            api_busy = False
            if m['ok']:
                cart_add(m['product'])
                scan_result = {'ok': True, 'product': m['product'], 'code': m['code']}
                toast(f"+ {m['product']['name']}", SU)
            else:
                scan_result = {'ok': False, 'code': m['code']}
                err = 'Baglanti hatasi' if m.get('net') else f"Bulunamadi: {m['code']}"
                toast(err, ER)
        elif m['t'] == 'link_ok':
            pi_user  = m['user']
            pi_token = m['token']
            first = pi_user['name'].split()[0] if pi_user.get('name') else pi_user.get('username', '')
            toast(f"Hosgeldin, {first}!", SU, 3)
        elif m['t'] == 'link_fail':
            toast(m.get('msg', 'Giris hatasi'), ER)
        elif m['t'] == 'receipt_ok':
            toast('Fis kaydedildi!', SU)
        elif m['t'] == 'receipt_fail':
            toast('Fis kaydedilemedi', ER)

    # ── Toast temizle
    if toast_data and time.time() > toast_data[2]:
        toast_data = None

    # ── Olaylar
    for ev in pygame.event.get():
        if ev.type == pygame.QUIT:
            running = False

        # Klavye (masaüstü geliştirme veya USB barkod okuyucu)
        elif ev.type == pygame.KEYDOWN and screen_name == 'scanner':
            if ev.key == pygame.K_RETURN:
                code = kbd_text.strip()
                if code:
                    if code.startswith('QTLINK:'):
                        redeem_link_token(code[len('QTLINK:'):])
                        go('cart')
                    else:
                        lookup(code)
                    kbd_text = ''
            elif ev.key == pygame.K_BACKSPACE:
                kbd_text = kbd_text[:-1]
            elif ev.unicode and ev.unicode.isprintable():
                kbd_text += ev.unicode; kbd_active = True

        # Dokunma/tıklama başlangıcı
        elif ev.type == pygame.MOUSEBUTTONDOWN:
            drag_start = ev.pos
            drag_scroll_start = cart_scroll if screen_name == 'cart' else co_scroll
            dragging = False

        elif ev.type == pygame.MOUSEMOTION:
            if drag_start and abs(ev.pos[1] - drag_start[1]) > 10:
                dragging = True
                delta = drag_start[1] - ev.pos[1]
                if screen_name == 'cart':
                    cart_scroll = max(0, drag_scroll_start + delta)
                elif screen_name == 'checkout':
                    co_scroll = max(0, drag_scroll_start + delta)

        # Dokunma bırakma → tap
        elif ev.type == pygame.MOUSEBUTTONUP and not dragging:
            pos = ev.pos

            if screen_name == 'cart':
                if hit(CART_SCAN_BTN, pos) or hit(CART_SCAN_ACT, pos):
                    go('scanner')
                elif hit(CART_PAY_ACT, pos):
                    go('checkout')
                elif pi_user and hit(USER_LOGOUT_BTN, pos):
                    pi_user  = None
                    pi_token = None
                    toast('Hesaptan cikis yapildi', T2)
                else:
                    for reg in _cart_items_y():
                        if hit(reg['plus'],  pos): cart_update(reg['barcode'],  1); break
                        if hit(reg['minus'], pos): cart_update(reg['barcode'], -1); break

            elif screen_name == 'scanner':
                if hit(BACK_BTN, pos):
                    go('cart')
                elif hit(MANUAL_IN, pos):
                    kbd_active = True
                elif hit(MANUAL_GO, pos):
                    if kbd_text.strip():
                        lookup(kbd_text.strip()); kbd_text = ''

            elif screen_name == 'checkout':
                if hit(BACK_BTN, pos) or hit(BACK_CO_BTN, pos):
                    go('cart')
                elif hit(CONFIRM_BTN, pos):
                    # Hesap bağlıysa fişi backend'e kaydet
                    if pi_user and pi_token:
                        items_snap = [dict(i) for i in cart]
                        threading.Thread(
                            target=_save_receipt,
                            args=(items_snap, pi_token),
                            daemon=True,
                        ).start()
                    cart.clear(); cart_scroll = 0
                    toast('Odeme tamamlandi!', SU)
                    go('cart')

            drag_start = None; dragging = False

        elif ev.type == pygame.MOUSEBUTTONUP:
            drag_start = None; dragging = False

    # ── Çiz
    if   screen_name == 'cart':     draw_cart()
    elif screen_name == 'scanner':  draw_scanner()
    elif screen_name == 'checkout': draw_checkout()
    draw_toast()
    pygame.display.flip()

    # Pi'de luma.lcd üzerinden ILI9341'e gönder
    if _disp is not None and _Image is not None:
        try:
            raw = pygame.surfarray.array3d(screen)   # (240, 320, 3)
            img = _Image.fromarray(raw.transpose(1, 0, 2), 'RGB')
            _disp.display(img)
        except Exception:
            pass

    clock.tick(FPS)

pygame.quit()
