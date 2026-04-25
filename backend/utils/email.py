import os
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr

MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
MAIL_FROM = os.getenv("MAIL_FROM", "noreply@codesecurex.com")
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))

conf = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=MAIL_PASSWORD,
    MAIL_FROM=MAIL_FROM,
    MAIL_PORT=MAIL_PORT,
    MAIL_SERVER=MAIL_SERVER,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=bool(MAIL_USERNAME and MAIL_PASSWORD),
    VALIDATE_CERTS=True,
)


def is_email_configured() -> bool:
    return bool(MAIL_USERNAME and MAIL_PASSWORD)


async def send_reset_email(email: EmailStr, reset_link: str):
    if not is_email_configured():
        raise RuntimeError(
            "Email service is not configured. Set MAIL_USERNAME and MAIL_PASSWORD in backend/.env."
        )
    html = f"""
    <p>Hi,</p>
    <p>You requested to reset your password for CodeSecureX.</p>
    <p>Click the link below to reset it (valid for 15 minutes):</p>
    <a href="{reset_link}">{reset_link}</a>
    <p>If you didn't request this, please ignore this email.</p>
    """
    
    message = MessageSchema(
        subject="Password Reset Request - CodeSecureX",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)
