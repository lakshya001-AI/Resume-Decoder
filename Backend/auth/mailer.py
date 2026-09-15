import logging
import smtplib
import ssl
from email.message import EmailMessage
from typing import Optional

from settings import get

logger = logging.getLogger("auth.mail")

SMTP_HOST = get("SMTP_HOST")
SMTP_PORT = int(get("SMTP_PORT", "587"))
SMTP_USER = get("SMTP_USER")
# Google displays app passwords in four spaced groups; the spaces are display
# only, so strip them rather than failing to authenticate on a copy-paste.
SMTP_PASSWORD = (get("SMTP_PASSWORD") or "").replace(" ", "")
SMTP_FROM = get("SMTP_FROM", "TrueOffer.AI <no-reply@trueoffer.ai>")
# Port 465 is implicit TLS; everything else negotiates STARTTLS.
SMTP_USE_SSL = SMTP_PORT == 465
SMTP_STARTTLS = get("SMTP_STARTTLS", "true").strip().lower() not in {"false", "0", "no"}

APP_NAME = get("APP_NAME", "TrueOffer.AI")


def smtp_configured() -> bool:
    return bool(SMTP_HOST)


def send_email(to: str, subject: str, text_body: str, html_body: Optional[str] = None) -> bool:
    """Send one mail, returning whether it actually went out.

    With no SMTP host configured the message is written to the server log
    instead, so the flow stays testable without a mail provider.
    """
    if not smtp_configured():
        logger.warning(
            "SMTP is not configured — no mail sent. Message that would have gone "
            "to %s:\n--- %s ---\n%s\n--- end ---",
            to,
            subject,
            text_body,
        )
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = SMTP_FROM
    message["To"] = to
    message.set_content(text_body)
    if html_body:
        message.add_alternative(html_body, subtype="html")

    try:
        if SMTP_USE_SSL:
            with smtplib.SMTP_SSL(
                SMTP_HOST, SMTP_PORT, context=ssl.create_default_context(), timeout=20
            ) as smtp:
                if SMTP_USER:
                    smtp.login(SMTP_USER, SMTP_PASSWORD)
                smtp.send_message(message)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as smtp:
                if SMTP_STARTTLS:
                    smtp.starttls(context=ssl.create_default_context())
                if SMTP_USER:
                    smtp.login(SMTP_USER, SMTP_PASSWORD)
                smtp.send_message(message)
    except Exception:
        # Runs in a background task, so this exception has nowhere to surface
        # except the log — the caller has already answered the request.
        logger.exception("Failed to send %r to %s", subject, to)
        return False

    logger.info("Sent %r to %s", subject, to)
    return True


def send_password_reset_email(to: str, full_name: str, reset_link: str, ttl_minutes: int) -> None:
    greeting = f"Hi {full_name.split(' ')[0]}," if full_name else "Hi,"
    subject = f"Reset your {APP_NAME} password"

    text_body = (
        f"{greeting}\n\n"
        f"We received a request to reset your {APP_NAME} password.\n\n"
        f"Open this link to choose a new one:\n{reset_link}\n\n"
        f"The link expires in {ttl_minutes} minutes and can only be used once.\n\n"
        "If you didn't ask for this, you can ignore this email — your password "
        "stays as it is.\n"
    )

    html_body = f"""\
<html>
  <body style="margin:0;padding:24px;background:#f5f4f0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e4e1d9;border-radius:12px;padding:32px;">
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#131a16;">{APP_NAME}</p>
      <p style="margin:0 0 12px;font-size:14px;color:#131a16;">{greeting}</p>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#131a16;">
        We received a request to reset your password. Choose a new one using the
        button below.
      </p>
      <a href="{reset_link}"
         style="display:inline-block;background:#0c6b4e;color:#ffffff;text-decoration:none;
                font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
        Reset my password
      </a>
      <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#131a16;opacity:0.6;">
        This link expires in {ttl_minutes} minutes and can only be used once.
        If you didn't ask for this, you can ignore this email — your password stays as it is.
      </p>
      <p style="margin:16px 0 0;font-size:11px;line-height:1.6;color:#131a16;opacity:0.45;word-break:break-all;">
        Button not working? Paste this into your browser:<br>{reset_link}
      </p>
    </div>
  </body>
</html>"""

    send_email(to, subject, text_body, html_body)
