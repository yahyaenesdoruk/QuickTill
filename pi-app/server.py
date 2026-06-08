#!/usr/bin/env python3
"""
QuickTill Pi App — Yerel HTTP Sunucusu
Pi'de çalışan kiosk uygulamasını port 8080'den sunar.
Chromium kiosk bu adrese bağlanır: http://localhost:8080
"""
import http.server
import socketserver
import os

PORT = 8080
DIR  = os.path.dirname(os.path.abspath(__file__))


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def log_message(self, fmt, *args):
        pass  # Sessiz çalış (log spam olmasın)

    def end_headers(self):
        # CORS başlıkları (WebSocket ve API çağrıları için)
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
        print(f"[pi-app] QuickTill kiosk uygulaması çalışıyor")
        print(f"[pi-app] Adres: http://localhost:{PORT}")
        httpd.serve_forever()
