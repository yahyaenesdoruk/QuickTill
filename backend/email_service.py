import os
import random
import string
import asyncio
from concurrent.futures import ThreadPoolExecutor
import urllib.request
import urllib.error
import json

_executor = ThreadPoolExecutor(max_workers=4)


def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))


def _send_email_sync(to_email: str, subject: str, html_body: str):
    api_key = os.environ.get('BREVO_API_KEY', '')

    if not api_key:
        import re
        plain = re.sub(r'<[^>]+>', '', html_body).strip()
        print(f"\n{'='*50}")
        print(f"[DEV EMAIL] To: {to_email}")
        print(f"Subject: {subject}")
        print(plain)
        print('='*50 + '\n')
        return

    sender_email = os.environ.get('SMTP_FROM', 'quicktill58@gmail.com')

    payload = json.dumps({
        "sender": {"name": "QuickTill", "email": sender_email},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_body
    }).encode('utf-8')

    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=payload,
        headers={
            "api-key": api_key,
            "Content-Type": "application/json",
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"[EMAIL SENT] To: {to_email}, Status: {resp.status}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"[EMAIL ERROR] HTTP {e.code}: {body}")
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")


async def send_email(to_email: str, subject: str, html_body: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(_executor, _send_email_sync, to_email, subject, html_body)


async def send_otp_email(to_email: str, otp: str, purpose: str = "Doğrulama"):
    subject = f"QuickTill - {purpose} Kodunuz"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;
                padding: 32px; background: #f9f9f9; border-radius: 12px;">
      <h2 style="color: #2E7D32; margin-bottom: 8px;">QuickTill</h2>
      <p style="color: #424242; font-size: 16px;">{purpose} için doğrulama kodunuz:</p>
      <div style="text-align: center; margin: 32px 0;">
        <span style="font-size: 48px; font-weight: bold;
                     letter-spacing: 12px; color: #2E7D32;">{otp}</span>
      </div>
      <p style="color: #757575; font-size: 14px;">
        Bu kod <strong>10 dakika</strong> geçerlidir.
      </p>
      <p style="color: #9e9e9e; font-size: 12px; margin-top: 24px;">
        Eğer bu işlemi siz başlatmadıysanız bu e-postayı dikkate almayın.
      </p>
    </div>
    """
    await send_email(to_email, subject, html_body)
