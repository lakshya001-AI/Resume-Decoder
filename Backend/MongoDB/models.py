from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

# bcrypt only hashes the first 72 bytes of a password, so anything longer is
# silently truncated. Reject it up front instead.
MAX_PASSWORD_LENGTH = 72

AuthProvider = Literal["password", "google"]


def validate_password_strength(value: str) -> str:
    """Shared by signup and password reset so the two cannot drift apart."""
    if not any(character.isalpha() for character in value):
        raise ValueError("Password must contain at least one letter.")
    if not any(character.isdigit() for character in value):
        raise ValueError("Password must contain at least one number.")
    return value


class UserSignup(BaseModel):
    """Payload for POST /api/auth/signup."""

    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=MAX_PASSWORD_LENGTH)

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        name = " ".join(value.split())
        if len(name) < 2:
            raise ValueError("Please enter your full name.")
        return name

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        return validate_password_strength(value)


class ForgotPasswordRequest(BaseModel):
    """Payload for POST /api/auth/forgot-password."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Payload for POST /api/auth/reset-password."""

    token: str = Field(min_length=1)
    password: str = Field(min_length=8, max_length=MAX_PASSWORD_LENGTH)

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        return validate_password_strength(value)


class MessageResponse(BaseModel):
    """A bare human-readable result, for endpoints with nothing else to say."""

    message: str


class UserLogin(BaseModel):
    """Payload for POST /api/auth/login."""

    email: EmailStr
    password: str = Field(min_length=1, max_length=MAX_PASSWORD_LENGTH)


class UserPublic(BaseModel):
    """The shape of a user as the frontend sees it — never includes the hash."""

    id: str
    full_name: str
    email: EmailStr
    avatar_url: Optional[str] = None
    auth_providers: list[AuthProvider] = Field(default_factory=list)


class AuthResponse(BaseModel):
    """Returned by signup, login and the social-login callback."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublic


class UserInDB(BaseModel):
    """The document stored in the `users` collection.

    `password_hash` is None for accounts created purely through Google — those
    users have no password to verify.
    """

    full_name: str
    email: EmailStr
    password_hash: Optional[str] = None
    avatar_url: Optional[str] = None
    email_verified: bool = False
    auth_providers: list[AuthProvider] = Field(default_factory=list)
    # provider name -> that provider's stable account id (the OIDC `sub`).
    provider_ids: dict[str, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login_at: Optional[datetime] = None


def to_public(document: dict) -> UserPublic:
    """Map a raw Mongo document onto the public user shape."""
    return UserPublic(
        id=str(document["_id"]),
        full_name=document.get("full_name", ""),
        email=document["email"],
        avatar_url=document.get("avatar_url"),
        auth_providers=document.get("auth_providers", []),
    )
