#!/usr/bin/env python3
"""
QuickTill Pi Kiosk — Yeni tasarım
240×320 ILI9341 SPI ekran + XPT2046 dokunmatik
Kullanım:
  python3 app.py          → Pi'de
  python3 app.py --dev    → Masaüstü test
"""

import os, sys, threading, time, json, queue
_spi_lock = threading.Lock()
import pygame
import requests

DEV = '--dev' in sys.argv
if not DEV:
    os.environ['SDL_VIDEODRIVER'] = 'offscreen'
    os.environ['SDL_NOMOUSE']     = '1'

W, H   = 240, 320
FPS    = 30 if DEV else 10
API    = 'https://quicktill-backend.onrender.com/api'
WS_URL = 'ws://localhost:8765'

# ── Renkler (web uygulamasıyla aynı palet) ────────────────────────────────────
P      = ( 46, 125,  50)   # #2E7D32 koyu yeşil
PL     = ( 76, 175,  80)   # #4CAF50 açık yeşil
BG     = (245, 245, 245)   # #F5F5F5 arka plan
WH     = (255, 255, 255)   # beyaz
TX     = ( 33,  33,  33)   # #212121 ana metin
T2     = (117, 117, 117)   # #757575 ikincil metin
BD     = (224, 224, 224)   # #E0E0E0 kenar
SU     = ( 56, 142,  60)   # #388E3C başarı
ER     = (211,  47,  47)   # #D32F2F hata
OK_BG  = (232, 245, 233)
OK_BD  = (129, 199, 132)
NO_BG  = (255, 235, 238)
NO_BD  = (239, 154, 154)

# ── pygame Init ───────────────────────────────────────────────────────────────
pygame.init()
screen = pygame.display.set_mode((W, H))
pygame.display.set_caption('QuickTill')
clock  = pygame.time.Clock()
if not DEV:
    pygame.mouse.set_visible(False)

# ── ILI9341 doğrudan SPI sürücüsü ────────────────────────────────────────────
_disp  = None
_Image = None
if not DEV:
    try:
        import spidev as _spidev
        import lgpio  as _lgpio
        import numpy  as _np
        from PIL import Image as _Image

        class _ILI9341:
            _DC = 24; _RST = 25
            def __init__(self):
                self._gh = _lgpio.gpiochip_open(0)
                try: _lgpio.gpio_free(self._gh, self._DC)
                except: pass
                try: _lgpio.gpio_free(self._gh, self._RST)
                except: pass
                _lgpio.gpio_claim_output(self._gh, self._DC)
                _lgpio.gpio_claim_output(self._gh, self._RST)
                self._spi = _spidev.SpiDev()
                self._spi.open(0, 0)
                self._spi.max_speed_hz = 32_000_000
                self._spi.mode = 0
                self._reset(); self._init()

            def _dc(self, v): _lgpio.gpio_write(self._gh, self._DC, v)
            def _rst(self, v): _lgpio.gpio_write(self._gh, self._RST, v)

            def _cmd(self, c, *d):
                self._dc(0); self._spi.writebytes([c])
                if d: self._dc(1); self._spi.writebytes(list(d))

            def _reset(self):
                self._rst(0); time.sleep(0.02)
                self._rst(1); time.sleep(0.15)

            def _init(self):
                c = self._cmd
                c(0xEF,0x03,0x80,0x02); c(0xCF,0x00,0xC1,0x30)
                c(0xED,0x64,0x03,0x12,0x81); c(0xE8,0x85,0x00,0x78)
                c(0xCB,0x39,0x2C,0x00,0x34,0x02); c(0xF7,0x20); c(0xEA,0x00,0x00)
                c(0xC0,0x23); c(0xC1,0x10); c(0xC5,0x3E,0x28); c(0xC7,0x86)
                c(0x36,0x48)  # MADCTL: MX=1, BGR=1
                c(0x3A,0x55)
                c(0xB1,0x00,0x18); c(0xB6,0x08,0x82,0x27); c(0xF2,0x00); c(0x26,0x01)
                c(0xE0,0x0F,0x31,0x2B,0x0C,0x0E,0x08,0x4E,0xF1,0x37,0x07,0x10,0x03,0x0E,0x09,0x00)
                c(0xE1,0x00,0x0E,0x14,0x03,0x11,0x07,0x31,0xC1,0x48,0x08,0x0F,0x0C,0x31,0x36,0x0F)
                c(0x11); time.sleep(0.12); c(0x29)

            def display(self, img):
                a  = _np.array(img, dtype=_np.uint16)
                # BGR565: display BGR=1 mode, B→high bits
                px = ((a[:,:,2]>>3)<<11)|((a[:,:,1]>>2)<<5)|(a[:,:,0]>>3)
                px = px.byteswap().astype(_np.uint16)
                data = px.tobytes()
                with _spi_lock:
                    self._cmd(0x2A,0x00,0x00,0x00,0xEF)
                    self._cmd(0x2B,0x00,0x00,0x01,0x3F)
                    self._dc(0); self._spi.writebytes([0x2C])
                    self._dc(1); self._spi.writebytes2(data)

        _disp = _ILI9341()
        print('[display] ILI9341 hazir')
    except Exception as _e:
        print(f'[display] HATA: {_e}')

# ── XPT2046 dokunmatik ────────────────────────────────────────────────────────
_tspi = None
if not DEV:
    try:
        import spidev as _tspidev
        _tspi = _tspidev.SpiDev()
        _tspi.open(0, 1)
        _tspi.max_speed_hz = 1_000_000
        _tspi.mode = 0
        print('[touch] XPT2046 hazir')
    except Exception as _te:
        print(f'[touch] HATA: {_te}')
_TX_MIN, _TX_MAX = 542, 3613
_TY_MIN, _TY_MAX = 437, 3782
_touching       = False
_touch_dragging = False
_touch_sx       = 0
_touch_sy       = 0
_touch_scroll0  = 0

# ── Fontlar ───────────────────────────────────────────────────────────────────
def _font(size, bold=False):
    for name in ['DejaVuSans', 'DejaVu Sans', 'FreeSans', None]:
        try:
            return (pygame.font.SysFont(name, size, bold=bold) if name
                    else pygame.font.Font(None, size+4))
        except Exception:
            continue
    return pygame.font.Font(None, size+4)

F11  = _font(11);  F12  = _font(12);  F13  = _font(13)
F16  = _font(16);  F20  = _font(20)
F12B = _font(12, True);  F13B = _font(13, True)
F14B = _font(14, True);  F15B = _font(15, True)

# ── Ürün listesi (web uygulamasıyla aynı) ────────────────────────────────────
PRODUCTS = [
    {'barcode':'8690504001011','name':'Sut 1L',             'price':28.50},
    {'barcode':'8690504002012','name':'Beyaz Peynir 500g',  'price':89.90},
    {'barcode':'8690504003013','name':'Kasar Peynir 350g',  'price':125.00},
    {'barcode':'8690504004014','name':'Yogurt 500g',        'price':19.90},
    {'barcode':'8690504005015','name':'Su 1.5L',            'price':6.50},
    {'barcode':'8690504006016','name':'Kola 2.5L',          'price':42.90},
    {'barcode':'8690504007017','name':'Ayran 1L',           'price':22.50},
    {'barcode':'8690504008018','name':'Meyve Suyu 1L',      'price':28.90},
    {'barcode':'8690504009019','name':'Ekmek',              'price':8.00},
    {'barcode':'8690504010020','name':'Makarna 500g',       'price':18.50},
    {'barcode':'8690504011021','name':'Pirinc 1kg',         'price':42.00},
    {'barcode':'8690504012022','name':'Un 1kg',             'price':19.90},
    {'barcode':'8690504013023','name':'Seker 1kg',          'price':35.00},
    {'barcode':'8690504014024','name':'Salca 700g',         'price':32.50},
    {'barcode':'8690504015025','name':'Ton Baligi Konserve','price':45.00},
    {'barcode':'8690504016026','name':'Zeytin 500g',        'price':55.00},
    {'barcode':'8690504017027','name':'Salam 150g',         'price':38.90},
    {'barcode':'8690504018028','name':'Sosis 500g',         'price':52.00},
    {'barcode':'8690504019029','name':'Deterjan 3kg',       'price':125.00},
    {'barcode':'8690504020030','name':'Bulasik Deterjani',  'price':35.90},
    {'barcode':'8690504021031','name':'Cips 150g',          'price':22.50},
    {'barcode':'8690504022032','name':'Cikolata 80g',       'price':18.90},
]

# ── State ─────────────────────────────────────────────────────────────────────
cart        = []
screen_name = 'cart'      # 'cart' | 'add' | 'checkout' | 'link'
add_tab     = 'products'  # 'products' | 'code'
link_pin    = ''          # 6 haneli PIN girişi
ws_status   = 'connecting'
scan_result = None
toast_data  = None
api_busy    = False
kbd_text    = ''
kbd_active  = False
cart_scroll = 0
prod_scroll = 0
co_scroll   = 0
event_queue  = queue.Queue()
pi_user      = None
pi_token     = None
link_busy    = False
pi_campaigns = []

# ── Sepet yardımcıları ────────────────────────────────────────────────────────
def cart_add(product):
    for item in cart:
        if item['barcode'] == product['barcode']:
            item['qty'] += 1; return
    cart.append({'barcode':product['barcode'], 'name':product['name'],
                 'price':float(product['price']), 'qty':1})

def cart_update(barcode, delta):
    global cart
    for item in cart:
        if item['barcode'] == barcode:
            item['qty'] = max(0, item['qty']+delta)
    cart[:] = [i for i in cart if i['qty'] > 0]

def cart_total(): return sum(i['price']*i['qty'] for i in cart)
def cart_count(): return sum(i['qty'] for i in cart)

def campaign_discount():
    """Aktif kampanyaların toplam indirimini hesapla."""
    total = cart_total()
    discount = 0.0
    for c in pi_campaigns:
        if not c.get('is_active', True): continue
        if c.get('discount_type') == 'percent':
            discount += total * c['discount_value'] / 100
        elif c.get('discount_type') == 'fixed':
            discount += c['discount_value']
    return round(min(discount, total), 2)

# ── API ───────────────────────────────────────────────────────────────────────
def _lookup(code):
    # Önce yerel listede ara
    for p in PRODUCTS:
        if p['barcode'] == code:
            event_queue.put({'t':'result','ok':True,'product':p,'code':code}); return
    # Backend'e sor
    try:
        r = requests.get(f'{API}/products/barcode/{code}', timeout=10)
        if r.status_code == 404:
            event_queue.put({'t':'result','ok':False,'code':code})
        elif r.ok:
            event_queue.put({'t':'result','ok':True,'product':r.json(),'code':code})
        else:
            event_queue.put({'t':'result','ok':False,'code':code})
    except Exception:
        event_queue.put({'t':'result','ok':False,'code':code,'net':True})

def lookup(code):
    global api_busy
    if api_busy: return
    api_busy = True
    threading.Thread(target=_lookup, args=(code,), daemon=True).start()

def _redeem_link_token(token):
    try:
        r = requests.post(f'{API}/auth/redeem-link-token', json={'token':token}, timeout=10)
        if r.ok:
            data = r.json()
            event_queue.put({'t':'link_ok','user':data['user'],'token':data['token']})
        else:
            try:    msg = r.json().get('detail','Giris hatasi')
            except: msg = 'Giris hatasi'
            event_queue.put({'t':'link_fail','msg':msg})
    except Exception:
        event_queue.put({'t':'link_fail','msg':'Baglanti hatasi'})

def redeem_link_token(token):
    threading.Thread(target=_redeem_link_token, args=(token,), daemon=True).start()

def _redeem_link_code(code):
    try:
        r = requests.post(f'{API}/auth/redeem-link-code', json={'code': code}, timeout=10)
        if r.ok:
            data = r.json()
            event_queue.put({'t':'link_ok','user':data['user'],'token':data['token']})
        else:
            try:    msg = r.json().get('detail','Giris hatasi')
            except: msg = 'Giris hatasi'
            event_queue.put({'t':'link_fail','msg':msg})
    except Exception:
        event_queue.put({'t':'link_fail','msg':'Baglanti hatasi'})

def redeem_link_code(code):
    threading.Thread(target=_redeem_link_code, args=(code,), daemon=True).start()

def _fetch_campaigns(token):
    try:
        r = requests.get(f'{API}/campaigns',
                         headers={'Authorization': f'Bearer {token}'}, timeout=10)
        if r.ok:
            event_queue.put({'t': 'campaigns_ok', 'campaigns': r.json()})
    except Exception:
        pass

def fetch_campaigns(token):
    threading.Thread(target=_fetch_campaigns, args=(token,), daemon=True).start()


def _save_receipt(items_snapshot, token, discount=0.0):
    from datetime import datetime as _dt
    now = _dt.now()
    ts  = str(int(now.timestamp()*1000))
    subtotal = round(sum(i['price']*i['qty'] for i in items_snapshot), 2)
    payload = {
        'receiptId':    f"#RCP-{now.strftime('%Y%m%d')}-{ts[-4:]}",
        'date':         now.strftime('%d.%m.%Y'),
        'time':         now.strftime('%H:%M'),
        'items':        [{'name':i['name'],'quantity':i['qty'],'unitPrice':i['price'],
                          'subtotal':round(i['price']*i['qty'],2)} for i in items_snapshot],
        'total':        round(subtotal - discount, 2),
        'itemCount':    sum(i['qty'] for i in items_snapshot),
        'paymentMethod':'Pi',
        'discount':     round(discount, 2),
    }
    try:
        r = requests.post(f'{API}/receipts', json=payload,
                          headers={'Authorization':f'Bearer {token}'}, timeout=15)
        event_queue.put({'t':'receipt_ok' if r.ok else 'receipt_fail'})
    except Exception:
        event_queue.put({'t':'receipt_fail'})

# ── WebSocket (USB barkod okuyucu) ────────────────────────────────────────────
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
                                event_queue.put({'t':'barcode','code':d['barcode']})
                        except Exception: pass
            except Exception:
                ws_status = 'error'
                await asyncio.sleep(5)
    asyncio.run(_run())

threading.Thread(target=_ws_loop, daemon=True).start()

# ── Çizim yardımcıları ────────────────────────────────────────────────────────
def fill_rect(color, rect, r=0):
    pygame.draw.rect(screen, color, rect, border_radius=r)

def stroke_rect(color, rect, w=1, r=0):
    pygame.draw.rect(screen, color, rect, w, border_radius=r)

def text(txt, font, color, x, y, anchor='left', max_w=0):
    s = str(txt)
    if max_w:
        while font.size(s)[0] > max_w and len(s) > 1:
            s = s[:-2]+'…'
    surf = font.render(s, True, color)
    if   anchor == 'center': x -= surf.get_width()//2
    elif anchor == 'right':  x -= surf.get_width()
    screen.blit(surf, (x, y))

def button(label, rect, bg, fg=WH, r=8):
    fill_rect(bg, rect, r)
    surf = F13B.render(label, True, fg)
    screen.blit(surf, (rect[0]+rect[2]//2-surf.get_width()//2,
                       rect[1]+rect[3]//2-surf.get_height()//2))

def hit(rect, pos):
    return pygame.Rect(rect).collidepoint(pos)

def toast(msg, color=SU, sec=2.3):
    global toast_data
    toast_data = (msg, color, time.time()+sec)

# ─────────────────────────────────────────────────────────────────────────────
# LAYOUT SABİTLERİ
# ─────────────────────────────────────────────────────────────────────────────
HDR = 44    # header yüksekliği
TAB_H = 34  # sekme çubuğu yüksekliği
FTR = 104   # sepet footer yüksekliği

# Sepet
CART_ADD_BTN    = (W-44, 6, 36, 32)        # sağ üst + dairesi
CART_SCAN_BTN   = (8, H-FTR+36, W-16, 30) # "Ürün Ekle" butonu
CART_PAY_BTN    = (8, H-FTR+70, W-16, 30) # "Ödeme Yap" butonu
CART_LINK_BTN   = (8, H-FTR+8,  W-16, 24) # "Hesap Bağla" (giriş yapılmamışsa)
USER_LOGOUT_BTN = (W-68, 10, 60, 24)

LST_Y = HDR
LST_H = H - HDR - FTR
ITM_H = 48

# Ürün ekleme
CONT_Y    = HDR + TAB_H          # 78 — içerik başlangıcı
PROD_H    = H - CONT_Y           # 242
PROD_IH   = 52                   # ürün kartı yüksekliği

ADD_BACK  = (0, 0, 44, HDR)
TAB_PROD  = (0,   HDR, W//2, TAB_H)
TAB_CODE  = (W//2, HDR, W//2, TAB_H)

# Manuel giriş (Kod Gir sekmesi — ekranın en altında sabit)
_MNL_BASE = H - 78               # 242
MANUAL_IN = (8,   _MNL_BASE+20, W-50, 32)
MANUAL_GO = (W-40, _MNL_BASE+20, 34, 32)

# Ödeme
CONFIRM_BTN = (8, H-68, W-16, 32)
BACK_CO_BTN = (8, H-32, W-16, 24)

# ─────────────────────────────────────────────────────────────────────────────
# EKRAN: SEPET
# ─────────────────────────────────────────────────────────────────────────────
def _cart_items_y():
    regions = []; y = LST_Y + 6 - cart_scroll
    for item in cart:
        plus_x  = W - 14
        num_x   = plus_x - 26
        minus_x = num_x  - 28
        regions.append({'barcode':item['barcode'],'y':y,
                        'plus':(plus_x-24, y+12, 24, 24),
                        'minus':(minus_x,  y+12, 24, 24)})
        y += ITM_H
    return regions

def draw_cart():
    screen.fill(BG)

    # Header
    fill_rect(WH, (0,0,W,HDR))
    pygame.draw.line(screen, BD, (0,HDR), (W,HDR), 1)
    if pi_user:
        pygame.draw.circle(screen, P, (18, HDR//2), 12)
        ini = pi_user['name'][0].upper() if pi_user.get('name') else '?'
        text(ini, F12B, WH, 18, HDR//2-6, 'center')
        first = pi_user['name'].split()[0] if pi_user.get('name') else ''
        text(first, F13B, TX, 34, 14, max_w=70)
        fill_rect(NO_BG, USER_LOGOUT_BTN, 8)
        stroke_rect(ER, USER_LOGOUT_BTN, 1, 8)
        text('Cikis', F11, ER,
             USER_LOGOUT_BTN[0]+USER_LOGOUT_BTN[2]//2,
             USER_LOGOUT_BTN[1]+6, 'center')
    else:
        text('QuickTill', F15B, TX, 12, 13)

    # Sağ üst + dairesi
    pygame.draw.circle(screen, P, (W-26, HDR//2), 15)
    text('+', F14B, WH, W-26, HDR//2-7, 'center')

    # Liste
    screen.set_clip(pygame.Rect(0, LST_Y, W, LST_H))
    if not cart:
        text('Sepet bos', F13B, T2, W//2, LST_Y+58, 'center')
        text('+ ile urun ekleyin', F11, T2, W//2, LST_Y+78, 'center')
    else:
        global cart_scroll
        max_s = max(0, len(cart)*ITM_H - LST_H)
        cart_scroll = max(0, min(cart_scroll, max_s))
        for item, reg in zip(cart, _cart_items_y()):
            y = reg['y']
            if y+ITM_H < LST_Y-2 or y > LST_Y+LST_H+2: continue
            fill_rect(WH, (6,y,W-12,ITM_H-4), 10)
            text(item['name'], F12B, TX, 12, y+5, max_w=118)
            text(f"{item['price']:.2f} TL/ad", F11, T2, 12, y+22)
            # Toplam
            text(f"{item['price']*item['qty']:.2f} TL", F12B, P,
                 reg['minus'][0]-8, y+14, 'right')
            # - butonu
            fill_rect(BG, reg['minus'], 6); stroke_rect(BD, reg['minus'], 1, 6)
            text('-', F14B, T2, reg['minus'][0]+12, reg['minus'][1]+4, 'center')
            # Adet
            nx = reg['minus'][0]+reg['minus'][2]+12
            text(str(item['qty']), F13B, TX, nx, y+14, 'center')
            # + butonu (yeşil daire)
            cx = reg['plus'][0]+12; cy = reg['plus'][1]+12
            pygame.draw.circle(screen, P, (cx, cy), 12)
            text('+', F13B, WH, cx, cy-6, 'center')
    screen.set_clip(None)

    # Footer
    fy = H - FTR
    pygame.draw.line(screen, BD, (0,fy), (W,fy), 1)
    fill_rect(WH, (0,fy,W,FTR))
    text(f'{cart_count()} urun', F12, T2, 12, fy+8)
    text(f'{cart_total():.2f} TL', F20, P, W-12, fy+4, 'right')
    if not pi_user:
        fill_rect(BG, CART_LINK_BTN, 8); stroke_rect(BD, CART_LINK_BTN, 1, 8)
        text('Hesabimi Bagla', F11, T2,
             CART_LINK_BTN[0]+CART_LINK_BTN[2]//2, CART_LINK_BTN[1]+6, 'center')
    button('+ Urun Ekle', CART_SCAN_BTN, P)
    button('Odeme Yap',   CART_PAY_BTN,  SU)

# ─────────────────────────────────────────────────────────────────────────────
# EKRAN: ÜRÜN EKLE
# ─────────────────────────────────────────────────────────────────────────────
def _prod_items_y():
    regions = []; y = CONT_Y + 4 - prod_scroll
    for p in PRODUCTS:
        regions.append({'barcode':p['barcode'],'y':y,
                        'add_btn':(W-44, y+10, 34, 32)})
        y += PROD_IH
    return regions

def draw_add():
    screen.fill(BG)

    # Header
    fill_rect(WH, (0,0,W,HDR))
    pygame.draw.line(screen, BD, (0,HDR), (W,HDR), 1)
    text('<', F14B, P, 10, 14)
    text('Urun Ekle', F15B, TX, W//2, 14, 'center')

    # Sekme çubuğu
    fill_rect(WH, (0,HDR,W,TAB_H))
    pygame.draw.line(screen, BD, (0,HDR+TAB_H), (W,HDR+TAB_H), 1)
    pygame.draw.line(screen, BD, (W//2,HDR+2), (W//2,HDR+TAB_H-2), 1)

    p_active = add_tab == 'products'
    text('Urunler', F12B if p_active else F12,
         P if p_active else T2, W//4, HDR+9, 'center')
    if p_active:
        pygame.draw.line(screen, P, (6, HDR+TAB_H-2), (W//2-6, HDR+TAB_H-2), 3)

    c_active = add_tab == 'code'
    text('Kod Gir', F12B if c_active else F12,
         P if c_active else T2, W*3//4, HDR+9, 'center')
    if c_active:
        pygame.draw.line(screen, P, (W//2+6, HDR+TAB_H-2), (W-6, HDR+TAB_H-2), 3)

    # ── Ürünler sekmesi ──────────────────────────────────────────────────────
    if add_tab == 'products':
        screen.set_clip(pygame.Rect(0, CONT_Y, W, PROD_H))
        global prod_scroll
        max_s = max(0, len(PRODUCTS)*PROD_IH - PROD_H + 8)
        prod_scroll = max(0, min(prod_scroll, max_s))
        for p, reg in zip(PRODUCTS, _prod_items_y()):
            y = reg['y']
            if y+PROD_IH < CONT_Y-2 or y > CONT_Y+PROD_H+2: continue
            fill_rect(WH, (6,y,W-12,PROD_IH-4), 10)
            text(p['name'],    F12B, TX, 12, y+5,  max_w=W-68)
            text(p['barcode'], F11,  T2, 12, y+22, max_w=W-68)
            text(f"{p['price']:.2f} TL", F12B, P, W-48, y+14, 'right')
            # + yeşil daire
            cx = reg['add_btn'][0]+17; cy = reg['add_btn'][1]+16
            pygame.draw.circle(screen, P, (cx, cy), 14)
            text('+', F14B, WH, cx, cy-7, 'center')
        screen.set_clip(None)

    # ── Kod Gir sekmesi ──────────────────────────────────────────────────────
    else:
        # Durum / tarama sonucu kartı
        cy = CONT_Y + 8
        if scan_result:
            if scan_result['ok']:
                p = scan_result['product']
                fill_rect(OK_BG, (8,cy,W-16,58), 10)
                stroke_rect(OK_BD, (8,cy,W-16,58), 1, 10)
                text(p['name'], F13B, TX, 14, cy+8, max_w=W-28)
                text(f"{p['price']:.2f} TL", F16, SU, 14, cy+28)
                qty = next((i['qty'] for i in cart if i['barcode']==p['barcode']),0)
                if qty: text(f'Sepette: {qty}', F11, T2, W-14, cy+30, 'right')
            else:
                fill_rect(NO_BG, (8,cy,W-16,44), 10)
                stroke_rect(NO_BD, (8,cy,W-16,44), 1, 10)
                text('Urun bulunamadi', F13B, ER, W//2, cy+8, 'center')
                text(str(scan_result.get('code','')), F11, T2, W//2, cy+26, 'center')
        else:
            fill_rect(WH, (8,cy,W-16,56), 10)
            if ws_status == 'ready':
                pygame.draw.circle(screen, SU, (22, cy+22), 6)
                text('USB Tarayici Hazir', F12B, TX, 34, cy+12)
                text('Barkodu okutun', F12, T2, 34, cy+30)
            elif ws_status == 'connecting':
                text('Tarayici bekleniyor...', F12, T2, W//2, cy+22, 'center')
            else:
                text('Tarayici bagli degil', F12, T2, W//2, cy+22, 'center')
                text('Manuel giris kullanin', F11, T2, W//2, cy+38, 'center')

        # Manuel giriş (alt şerit — sabit)
        fill_rect(WH, (0,_MNL_BASE,W,H-_MNL_BASE))
        pygame.draw.line(screen, BD, (0,_MNL_BASE), (W,_MNL_BASE), 1)
        text('Manuel Barkod:', F12, T2, 10, _MNL_BASE+6)
        box_c = P if kbd_active else BD
        fill_rect(WH, MANUAL_IN, 6); stroke_rect(box_c, MANUAL_IN, 2, 6)
        disp = kbd_text if kbd_text else '8691234567890'
        col  = TX if kbd_text else T2
        text(disp, F12, col, MANUAL_IN[0]+6, MANUAL_IN[1]+8, max_w=MANUAL_IN[2]-10)
        fill_rect(P, MANUAL_GO, 6)
        text('>', F14B, WH, MANUAL_GO[0]+MANUAL_GO[2]//2, MANUAL_GO[1]+8, 'center')

# ─────────────────────────────────────────────────────────────────────────────
# EKRAN: ÖDEME
# ─────────────────────────────────────────────────────────────────────────────
def draw_checkout():
    screen.fill(BG)
    disc = campaign_discount()
    has_disc = disc > 0

    # Header
    fill_rect(WH, (0,0,W,HDR))
    pygame.draw.line(screen, BD, (0,HDR), (W,HDR), 1)
    text('<', F14B, P, 10, 14)
    text('Odeme', F15B, TX, W//2, 14, 'center')

    # Kalemler
    clip_h = H - HDR - 74 - (28 if has_disc else 0)
    screen.set_clip(pygame.Rect(0, HDR, W, clip_h))
    y = HDR+8 - co_scroll
    for item in cart:
        pygame.draw.line(screen, BD, (10,y+28), (W-10,y+28), 1)
        text(f"{item['name']} x{item['qty']}", F12, TX, 10, y+6, max_w=148)
        text(f"{item['price']*item['qty']:.2f} TL", F12B, P, W-10, y+6, 'right')
        y += 32
    # Ara toplam satırı
    fill_rect(WH, (0,y,W,36))
    pygame.draw.line(screen, BD, (0,y), (W,y), 1)
    if has_disc:
        text('Ara Toplam', F12, T2, 10, y+10)
        text(f'{cart_total():.2f} TL', F13B, T2, W-10, y+10, 'right')
    else:
        text('TOPLAM', F13B, TX, 10, y+10)
        text(f'{cart_total():.2f} TL', F20, P, W-10, y+6, 'right')
    screen.set_clip(None)

    # İndirim + net toplam satırı
    if has_disc:
        dy = H - 74 - 28
        fill_rect((232,245,233), (0, dy, W, 28))
        pygame.draw.line(screen, OK_BD, (0, dy), (W, dy), 1)
        text('Kampanya', F12B, SU, 10, dy+7)
        text(f'-{disc:.2f} TL', F12B, SU, W//2-4, dy+7, 'right')
        text(f'{cart_total()-disc:.2f} TL', F14B, P, W-10, dy+5, 'right')

    # Butonlar
    button('Odemeyi Onayla', CONFIRM_BTN, SU)
    fill_rect(WH, BACK_CO_BTN, 8); stroke_rect(P, BACK_CO_BTN, 1, 8)
    button('< Geri Don', BACK_CO_BTN, WH, P)

# ─────────────────────────────────────────────────────────────────────────────
# EKRAN: HESAP BAĞLAMA — sadece PIN tuş takımı
# ─────────────────────────────────────────────────────────────────────────────
LINK_BACK = (0, 0, 44, HDR)

_KP_W = W // 3           # 80 px
_KP_Y0 = 130             # tuş takımı başlangıç Y
_KP_H = (H - _KP_Y0) // 4  # 47 px

def _kp_rect(row, col):
    return (col * _KP_W, _KP_Y0 + row * _KP_H, _KP_W, _KP_H)

_KP_KEYS = [
    (0,0,'1','1'),(0,1,'2','2'),(0,2,'3','3'),
    (1,0,'4','4'),(1,1,'5','5'),(1,2,'6','6'),
    (2,0,'7','7'),(2,1,'8','8'),(2,2,'9','9'),
    (3,0,'<','DEL'),(3,1,'0','0'),(3,2,'OK','OK'),
]

def draw_link():
    screen.fill(BG)

    # Header
    fill_rect(WH, (0, 0, W, HDR))
    pygame.draw.line(screen, BD, (0, HDR), (W, HDR), 1)
    text('<', F14B, P, 10, 14)
    text('Hesabimi Bagla', F15B, TX, W//2, 14, 'center')

    # Açıklama
    fill_rect(WH, (0, HDR, W, _KP_Y0 - HDR))
    pygame.draw.line(screen, BD, (0, _KP_Y0), (W, _KP_Y0), 1)
    text('Telefondan 6 haneli kodu al:', F12, T2, W//2, HDR + 10, 'center')
    text('Profil > Pi\'ye Baglan', F11, T2, W//2, HDR + 26, 'center')

    # PIN kutuları
    bx = (W - (6 * 32 + 5 * 4)) // 2
    for i in range(6):
        xi = bx + i * 36
        filled = i < len(link_pin)
        fill_rect(WH if filled else BG, (xi, HDR + 54, 32, 36), 6)
        stroke_rect(P if filled else BD, (xi, HDR + 54, 32, 36), 2, 6)
        if filled:
            text(link_pin[i], F14B, TX, xi + 16, HDR + 61, 'center')

    # Tuş takımı
    for row, col, label, val in _KP_KEYS:
        rx, ry, rw, rh = _kp_rect(row, col)
        is_ok  = val == 'OK'
        is_del = val == 'DEL'
        bg = SU if is_ok else (NO_BG if is_del else WH)
        fg = WH if is_ok else (ER if is_del else TX)
        fill_rect(bg, (rx, ry, rw, rh))
        stroke_rect(BD, (rx, ry, rw, rh), 1)
        text(label, F14B, fg, rx + rw//2, ry + rh//2 - 8, 'center')

# ── Toast ─────────────────────────────────────────────────────────────────────
def draw_toast():
    if not toast_data: return
    msg, color, exp = toast_data
    if time.time() > exp: return
    surf = F12B.render(msg, True, WH)
    tw   = surf.get_width()+20
    fill_rect(color, ((W-tw)//2, H-30, tw, 22), 8)
    screen.blit(surf, ((W-tw)//2+10, H-26))

# ── Ekran geçişi ──────────────────────────────────────────────────────────────
def go(name):
    global screen_name, scan_result, kbd_text, kbd_active
    global cart_scroll, prod_scroll, co_scroll, add_tab, link_pin, link_busy
    screen_name = name
    if name == 'add':
        scan_result = None; kbd_text = ''; kbd_active = False
    if name == 'cart':
        cart_scroll = 0
    if name == 'checkout':
        co_scroll = 0
        if not cart:
            toast('Sepet bos!', ER); screen_name = 'cart'
    if name == 'link':
        link_pin = ''; link_busy = False

# ── Ana döngü ─────────────────────────────────────────────────────────────────
drag_start        = None
drag_scroll_start = 0
dragging          = False
running = True

while running:

    # Arka plan mesajları
    while not event_queue.empty():
        m = event_queue.get_nowait()
        if m['t'] == 'barcode':
            code = m['code']
            if code.startswith('QTLINK:'):
                redeem_link_token(code[len('QTLINK:'):]); go('cart')
            else:
                go('add'); add_tab = 'code'; lookup(code)
        elif m['t'] == 'result':
            api_busy = False
            if m['ok']:
                cart_add(m['product'])
                scan_result = {'ok':True,'product':m['product'],'code':m['code']}
                toast(f"+ {m['product']['name']}", SU)
            else:
                scan_result = {'ok':False,'code':m['code']}
                toast(f"Bulunamadi: {m['code']}", ER)
        elif m['t'] == 'link_ok':
            link_busy = False
            pi_user = m['user']; pi_token = m['token']
            fetch_campaigns(pi_token)
            first = pi_user['name'].split()[0] if pi_user.get('name') else pi_user.get('username','')
            toast(f"Hosgeldin, {first}!", SU, 3)
            if screen_name == 'link': go('cart')
        elif m['t'] == 'link_fail':
            link_busy = False
            link_pin = ''
            toast(m.get('msg','Giris hatasi'), ER)
        elif m['t'] == 'campaigns_ok':
            pi_campaigns = m['campaigns']
        elif m['t'] == 'receipt_ok':
            toast('Fis kaydedildi!', SU)
        elif m['t'] == 'receipt_fail':
            toast('Fis kaydedilemedi', ER)

    if toast_data and time.time() > toast_data[2]:
        toast_data = None

    # Pygame olayları (masaüstü / klavye)
    for ev in pygame.event.get():
        if ev.type == pygame.QUIT:
            running = False

        elif ev.type == pygame.KEYDOWN and screen_name == 'add' and add_tab == 'code':
            if ev.key == pygame.K_RETURN:
                code = kbd_text.strip()
                if code:
                    if code.startswith('QTLINK:'):
                        redeem_link_token(code[len('QTLINK:'):]); go('cart')
                    else:
                        lookup(code)
                    kbd_text = ''
            elif ev.key == pygame.K_BACKSPACE:
                kbd_text = kbd_text[:-1]
            elif ev.unicode and ev.unicode.isprintable():
                kbd_text += ev.unicode; kbd_active = True

        elif ev.type == pygame.MOUSEBUTTONDOWN:
            drag_start = ev.pos
            drag_scroll_start = (cart_scroll if screen_name == 'cart'
                                 else prod_scroll if screen_name == 'add' and add_tab == 'products'
                                 else co_scroll)
            dragging = False

        elif ev.type == pygame.MOUSEMOTION:
            if drag_start and abs(ev.pos[1]-drag_start[1]) > 10:
                dragging = True
                delta = drag_start[1]-ev.pos[1]
                if screen_name == 'cart':
                    cart_scroll = max(0, drag_scroll_start+delta)
                elif screen_name == 'add' and add_tab == 'products':
                    prod_scroll = max(0, drag_scroll_start+delta)
                elif screen_name == 'checkout':
                    co_scroll = max(0, drag_scroll_start+delta)

        elif ev.type == pygame.MOUSEBUTTONUP and not dragging:
            pos = ev.pos
            if screen_name == 'cart':
                if hit(CART_ADD_BTN, pos) or hit(CART_SCAN_BTN, pos):
                    go('add')
                elif hit(CART_PAY_BTN, pos):
                    go('checkout')
                elif not pi_user and hit(CART_LINK_BTN, pos):
                    go('link')
                elif pi_user and hit(USER_LOGOUT_BTN, pos):
                    pi_user = None; pi_token = None; pi_campaigns = []
                    toast('Cikis yapildi', T2)
                else:
                    for reg in _cart_items_y():
                        if hit(reg['plus'],  pos): cart_update(reg['barcode'],  1); break
                        if hit(reg['minus'], pos): cart_update(reg['barcode'], -1); break

            elif screen_name == 'link':
                if hit(LINK_BACK, pos):
                    go('cart')
                else:
                    for row, col, label, val in _KP_KEYS:
                        if hit(_kp_rect(row, col), pos):
                            if val == 'DEL':
                                link_pin = link_pin[:-1]
                            elif val == 'OK':
                                if len(link_pin) == 6 and not link_busy:
                                    link_busy = True
                                    toast('Dogrulanıyor...', T2, 10)
                                    redeem_link_code(link_pin)
                                elif not link_busy:
                                    toast('6 hane gir!', ER)
                            else:
                                if len(link_pin) < 6:
                                    link_pin += val
                            break

            elif screen_name == 'add':
                if hit(ADD_BACK, pos):
                    go('cart')
                elif hit(TAB_PROD, pos):
                    add_tab = 'products'; scan_result = None
                elif hit(TAB_CODE, pos):
                    add_tab = 'code'
                elif add_tab == 'products':
                    for p, reg in zip(PRODUCTS, _prod_items_y()):
                        if hit(reg['add_btn'], pos):
                            cart_add(p); toast(f"+ {p['name']}", SU); break
                elif add_tab == 'code':
                    if hit(MANUAL_IN, pos):   kbd_active = True
                    elif hit(MANUAL_GO, pos):
                        if kbd_text.strip(): lookup(kbd_text.strip()); kbd_text = ''

            elif screen_name == 'checkout':
                if hit(ADD_BACK, pos) or hit(BACK_CO_BTN, pos):
                    go('cart')
                elif hit(CONFIRM_BTN, pos):
                    if pi_user and pi_token:
                        snap = [dict(i) for i in cart]
                        disc = campaign_discount()
                        threading.Thread(target=_save_receipt,
                                         args=(snap, pi_token, disc),
                                         daemon=True).start()
                    cart.clear(); cart_scroll = 0
                    toast('Odeme tamamlandi!', SU); go('cart')

            drag_start = None; dragging = False

        elif ev.type == pygame.MOUSEBUTTONUP:
            drag_start = None; dragging = False

    # Çiz
    if   screen_name == 'cart':     draw_cart()
    elif screen_name == 'add':      draw_add()
    elif screen_name == 'checkout': draw_checkout()
    elif screen_name == 'link':     draw_link()
    draw_toast()
    pygame.display.flip()

    # ILI9341'e gönder
    if _disp is not None and _Image is not None:
        try:
            _raw = pygame.surfarray.array3d(screen)
            _img = _Image.fromarray(_raw.transpose(1,0,2), 'RGB')
            _disp.display(_img)
        except Exception:
            pass

    # XPT2046 dokunmatik okuma (tap + kaydırma)
    if _tspi is not None:
        try:
            def _tr(c):
                r = _tspi.xfer2([c,0,0])
                return ((r[1]<<8)|r[2])>>3
            _z = _tr(0xB0)
            if _z > 200:
                _sx = max(0,min(W-1,int((_tr(0xD0)-_TX_MIN)/(_TX_MAX-_TX_MIN)*W)))
                _sy = max(0,min(H-1,int((_TY_MAX-_tr(0x90))/(_TY_MAX-_TY_MIN)*H)))
                if not _touching:
                    # İlk temas — başlangıç noktasını kaydet
                    _touching      = True
                    _touch_sx      = _sx
                    _touch_sy      = _sy
                    _touch_dragging = False
                    _touch_scroll0 = (cart_scroll if screen_name == 'cart'
                                      else prod_scroll if screen_name == 'add' and add_tab == 'products'
                                      else co_scroll)
                else:
                    # Devam eden temas — kaydırma kontrolü
                    _dy = _touch_sy - _sy   # yukarı kaydırma pozitif
                    if abs(_dy) > 8:
                        _touch_dragging = True
                        if screen_name == 'cart':
                            cart_scroll = max(0, _touch_scroll0 + _dy)
                        elif screen_name == 'add' and add_tab == 'products':
                            prod_scroll = max(0, _touch_scroll0 + _dy)
                        elif screen_name == 'checkout':
                            co_scroll   = max(0, _touch_scroll0 + _dy)
            else:
                if _touching and not _touch_dragging:
                    # Bırakıldı ve sürükleme yoktu → tap işle
                    _tp = (_touch_sx, _touch_sy)
                    if screen_name == 'cart':
                        if hit(CART_ADD_BTN,_tp) or hit(CART_SCAN_BTN,_tp): go('add')
                        elif hit(CART_PAY_BTN,_tp): go('checkout')
                        elif not pi_user and hit(CART_LINK_BTN,_tp): go('link')
                        elif pi_user and hit(USER_LOGOUT_BTN,_tp):
                            pi_user=None; pi_token=None; pi_campaigns=[]
                            toast('Cikis yapildi',T2)
                        else:
                            for _rg in _cart_items_y():
                                if hit(_rg['plus'], _tp):  cart_update(_rg['barcode'], 1);  break
                                if hit(_rg['minus'],_tp):  cart_update(_rg['barcode'],-1); break
                    elif screen_name == 'link':
                        if hit(LINK_BACK,_tp):
                            go('cart')
                        else:
                            for _row,_col,_lbl,_val in _KP_KEYS:
                                if hit(_kp_rect(_row,_col),_tp):
                                    if _val == 'DEL':
                                        link_pin = link_pin[:-1]
                                    elif _val == 'OK':
                                        if len(link_pin)==6 and not link_busy:
                                            link_busy = True
                                            toast('Dogrulanıyor...', T2, 10)
                                            redeem_link_code(link_pin)
                                        elif not link_busy:
                                            toast('6 hane gir!',ER)
                                    else:
                                        if len(link_pin)<6: link_pin += _val
                                    break
                    elif screen_name == 'add':
                        if hit(ADD_BACK,_tp):   go('cart')
                        elif hit(TAB_PROD,_tp): add_tab='products'; scan_result=None
                        elif hit(TAB_CODE,_tp): add_tab='code'
                        elif add_tab == 'products':
                            for _p,_r in zip(PRODUCTS,_prod_items_y()):
                                if hit(_r['add_btn'],_tp):
                                    cart_add(_p); toast(f"+ {_p['name']}",SU); break
                        elif add_tab == 'code':
                            if hit(MANUAL_IN,_tp):  kbd_active=True
                            elif hit(MANUAL_GO,_tp):
                                if kbd_text.strip(): lookup(kbd_text.strip()); kbd_text=''
                    elif screen_name == 'checkout':
                        if hit(ADD_BACK,_tp) or hit(BACK_CO_BTN,_tp): go('cart')
                        elif hit(CONFIRM_BTN,_tp):
                            if pi_user and pi_token:
                                _snap=[dict(i) for i in cart]
                                _disc=campaign_discount()
                                threading.Thread(target=_save_receipt,
                                    args=(_snap,pi_token,_disc),daemon=True).start()
                            cart.clear(); cart_scroll=0
                            toast('Odeme tamamlandi!',SU); go('cart')
                _touching       = False
                _touch_dragging = False
        except Exception:
            pass

    clock.tick(FPS)

pygame.quit()
