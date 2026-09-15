import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
import jwt

from settings import get, require

JWT_SECRET = require("JWT_SECRET")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL = timedelta(days=int(get("ACCESS_TOKEN_TTL_DAYS", "7")))
# The OAuth round-trip to the provider and back should take seconds, not minutes.
OAUTH_STATE_TTL = timedelta(minutes=10)
# Long enough to find the mail, short enough that a forwarded inbox is not a
# standing key to the account.
PASSWORD_RESET_TTL = timedelta(minutes=int(get("PASSWORD_RESET_TTL_MINUTES", "30")))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: Optional[str]) -> bool:
    """Check a password against a stored hash.

    Returns False rather than raising for accounts that have no password (social
    logins) or a hash Mongo somehow stored in an unreadable shape.
    """
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def _encode(payload: dict[str, Any], ttl: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {**payload, "type": token_type, "iat": now, "exp": now + ttl},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def _decode(token: str, token_type: str) -> Optional[dict[str, Any]]:
    try:
        claims = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
    # A state token must never be usable as an access token, or vice versa.
    if claims.get("type") != token_type:
        return None
    return claims


def create_access_token(user_id: str, email: str) -> str:
    return _encode({"sub": user_id, "email": email}, ACCESS_TOKEN_TTL, "access")


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    return _decode(token, "access")


def create_oauth_state(provider: str, redirect_path: str) -> str:
    """Sign the OAuth `state` parameter so the callback can trust it.

    Keeping the state signed rather than stored means no server-side session is
    needed, and a forged callback cannot pass the signature check.
    """
    return _encode(
        {"provider": provider, "redirect_path": redirect_path}, OAUTH_STATE_TTL, "oauth_state"
    )


def decode_oauth_state(state: str) -> Optional[dict[str, Any]]:
    return _decode(state, "oauth_state")


def access_token_ttl_seconds() -> int:
    return int(ACCESS_TOKEN_TTL.total_seconds())


def password_fingerprint(password_hash: Optional[str]) -> str:
    """A short digest of the password a reset token was issued against.

    Carrying this in the token makes it effectively single-use: completing a
    reset changes the hash, so every outstanding token for that account stops
    matching — no server-side store of issued tokens required.
    """
    return hashlib.sha256((password_hash or "no-password").encode("utf-8")).hexdigest()[:32]


def create_password_reset_token(user_id: str, password_hash: Optional[str]) -> str:
    return _encode(
        {"sub": user_id, "pwd": password_fingerprint(password_hash)},
        PASSWORD_RESET_TTL,
        "password_reset",
    )


def decode_password_reset_token(token: str) -> Optional[dict[str, Any]]:
    return _decode(token, "password_reset")


def password_reset_ttl_minutes() -> int:
    return int(PASSWORD_RESET_TTL.total_seconds() // 60)
