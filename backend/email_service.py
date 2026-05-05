import smtplib
import os
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import asyncio
from concurrent.futures import ThreadPoolExecutor

_executor = ThreadPoolExecutor(max_workers=4)


def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))


def _send_email_sync(to_email: str, subject: str, html_body: str):
    smtp_host = os.environ.get('SMTP_HOST', '')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')

    if not smtp_host or not smtp_user or not smtp_password:
        # Dev mode: print to console
        import re
        plain = re.sub(r'<[^>]+>', '', html_body).strip()
        print(f"\n{'='*50}")
        print(f"[DEV EMAIL] To: {to_email}")
        print(f"Subject: {subject}")
        print(plain)
        print('='*50 + '\n')
        return

    import re
    plain = re.sub(r'<[^>]+>', '', html_body).strip()

    msg = MIMEMultipart('alternative')
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_body, 'html'))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            print(f"[EMAIL SENT] To: {to_email}")
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        print(f"\n{'='*50}")
        print(f"[FALLBACK] To: {to_email}")
        print(f"Subject: {subject}")
        print(plain)
        print('='*50 + '\n')


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
