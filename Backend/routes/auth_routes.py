import logging
import time
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlencode

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from pymongo.errors import DuplicateKeyError

from auth.dependencies import get_current_user
from auth.oauth import (
    FRONTEND_URL,
    PROVIDERS,
    OAuthError,
    OAuthProfile,
    build_authorize_url,
    exchange_code_for_profile,
)
from auth.mailer import send_password_reset_email, smtp_configured
from auth.security import (
    access_token_ttl_seconds,
    create_access_token,
    create_oauth_state,
    create_password_reset_token,
    decode_oauth_state,
    decode_password_reset_token,
    hash_password,
    password_fingerprint,
    password_reset_ttl_minutes,
    verify_password,
)
from MongoDB.configuration import users_collection
from MongoDB.models import (
    AuthResponse,
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    UserInDB,
    UserLogin,
    UserPublic,
    UserSignup,
    to_public,
)

logger = logging.getLogger("auth")

router = APIRouter(prefix="/auth", tags=["auth"])

# Where the frontend handles the hand-off after a social login.
FRONTEND_CALLBACK_PATH = "/auth/callback"

# The OAuth error codes that genuinely mean "the user backed out". Everything
# else is a misconfiguration and must not be reported as a cancellation.
CANCELLED_CODES = {
    "access_denied",
    "user_cancelled_login",
    "user_cancelled_authorize",
}

# The provider does not recognise the scopes we asked for, which in practice
# means the sign-in product is not enabled on the provider-side app.
SCOPE_CODES = {
    "invalid_scope_error",
    "unauthorized_scope_error",
    "invalid_scope",
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _auth_response(document: dict) -> AuthResponse:
    user = to_public(document)
    return AuthResponse(
        access_token=create_access_token(user.id, user.email),
        expires_in=access_token_ttl_seconds(),
        user=user,
    )


# --------------------------------------------------------------------------- #
# Email + password
# --------------------------------------------------------------------------- #

@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserSignup):
    email = payload.email.strip().lower()

    document = UserInDB(
        full_name=payload.full_name,
        email=email,
        password_hash=hash_password(payload.password),
        auth_providers=["password"],
        last_login_at=_now(),
    ).model_dump()

    try:
        result = users_collection.insert_one(document)
    except DuplicateKeyError:
        # The unique index is the real guard — checking first would still leave a
        # window for two concurrent signups on the same email.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Try logging in instead.",
        )

    document["_id"] = result.inserted_id
    return _auth_response(document)


@router.post("/login", response_model=AuthResponse)
async def login(payload: UserLogin):
    email = payload.email.strip().lower()
    document = users_collection.find_one({"email": email})

    # Same message for "no such user" and "wrong password" so the endpoint does
    # not reveal which emails are registered.
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password.",
    )

    if not document:
        raise invalid

    if not document.get("password_hash"):
        providers = ", ".join(document.get("auth_providers", [])) or "a social account"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"This account was created with {providers}. Use that button to log in.",
        )

    if not verify_password(payload.password, document["password_hash"]):
        raise invalid

    users_collection.update_one(
        {"_id": document["_id"]}, {"$set": {"last_login_at": _now()}}
    )
    return _auth_response(document)


@router.get("/me", response_model=UserPublic)
async def me(current_user: UserPublic = Depends(get_current_user)):
    """Used by the frontend on boot to check whether a stored token is still good."""
    return current_user


@router.get("/providers")
async def providers():
    """Tells the UI which social buttons are actually wired up."""
    return {name: provider.configured for name, provider in PROVIDERS.items()}


# --------------------------------------------------------------------------- #
# Forgot / reset password
#
# Declared before the /{provider_name}/... routes below so these literal paths
# are never considered as a provider name.
# --------------------------------------------------------------------------- #

# Crude per-process throttle. Enough to stop this endpoint being used to spam
# someone's inbox; a multi-worker deployment wants a shared store instead.
RESET_WINDOW_SECONDS = 3600
RESET_MAX_PER_WINDOW = 5
_reset_attempts: dict[str, list[float]] = {}


def _allow_reset_request(email: str) -> bool:
    now = time.monotonic()
    recent = [t for t in _reset_attempts.get(email, []) if now - t < RESET_WINDOW_SECONDS]
    if len(recent) >= RESET_MAX_PER_WINDOW:
        _reset_attempts[email] = recent
        return False
    recent.append(now)
    _reset_attempts[email] = recent
    return True


def _resolve_reset_token(token: str) -> Optional[dict]:
    """Return the user a reset token belongs to, or None if it is no good."""
    claims = decode_password_reset_token(token)
    if not claims:
        return None

    try:
        user_id = ObjectId(claims["sub"])
    except (KeyError, TypeError, InvalidId):
        return None

    document = users_collection.find_one({"_id": user_id})
    if not document:
        return None

    # Stale once the password has changed — this is what makes it single-use.
    if claims.get("pwd") != password_fingerprint(document.get("password_hash")):
        return None

    return document


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(payload: ForgotPasswordRequest, background: BackgroundTasks):
    """Start a password reset by emailing a link.

    Always answers the same way. Confirming whether an address is registered
    would turn this into a way to enumerate accounts, so the caller cannot tell
    a hit from a miss — including by timing, since the mail goes out in the
    background either way.
    """
    email = payload.email.strip().lower()
    generic = MessageResponse(
        message="If an account exists for that email, a reset link is on its way."
    )

    if not _allow_reset_request(email):
        logger.warning("Password reset throttled for %s", email)
        return generic

    document = users_collection.find_one({"email": email})
    if not document:
        return generic

    token = create_password_reset_token(str(document["_id"]), document.get("password_hash"))
    reset_link = f"{FRONTEND_URL}/resetPassword?{urlencode({'token': token})}"

    background.add_task(
        send_password_reset_email,
        email,
        document.get("full_name", ""),
        reset_link,
        password_reset_ttl_minutes(),
    )
    if not smtp_configured():
        logger.warning("SMTP not configured — reset link will be printed to this log instead.")

    return generic


@router.get("/reset-password/validate")
async def validate_reset_token(token: str = Query(...)):
    """Lets the reset screen say "this link expired" before the user types."""
    return {"valid": _resolve_reset_token(token) is not None}


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(payload: ResetPasswordRequest):
    document = _resolve_reset_token(payload.token)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link is invalid or has expired. Please request a new one.",
        )

    users_collection.update_one(
        {"_id": document["_id"]},
        {
            "$set": {
                "password_hash": hash_password(payload.password),
                "updated_at": _now(),
            },
            # An account that only had Google can now sign in with a password too.
            "$addToSet": {"auth_providers": "password"},
        },
    )
    logger.info("Password reset completed for %s", document["email"])

    # Deliberately no session issued here: possession of the emailed link should
    # not by itself log someone in.
    return MessageResponse(
        message="Your password has been updated. You can now log in with it."
    )


# --------------------------------------------------------------------------- #
# Social login (Google)
# --------------------------------------------------------------------------- #

@router.get("/{provider_name}/authorize")
async def social_authorize(
    provider_name: str,
    redirect_path: str = Query("/main", description="Frontend path to land on afterwards"),
):
    """Kick off the social login by bouncing the browser to the provider."""
    provider = PROVIDERS.get(provider_name)
    if not provider:
        raise HTTPException(status_code=404, detail="Unknown login provider.")
    if not provider.configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{provider.display_name} login is not configured on this server.",
        )

    # Only ever send the browser to a path on our own frontend.
    if not redirect_path.startswith("/") or redirect_path.startswith("//"):
        redirect_path = "/main"

    state = create_oauth_state(provider_name, redirect_path)
    return RedirectResponse(build_authorize_url(provider, state), status_code=307)


@router.get("/{provider_name}/callback")
async def social_callback(
    provider_name: str,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
):
    """Where the provider sends the browser back.

    Always ends in a redirect to the frontend: with a token on success, with an
    `error` message otherwise, so the user never sees a raw JSON error page.
    """
    provider = PROVIDERS.get(provider_name)
    if not provider:
        raise HTTPException(status_code=404, detail="Unknown login provider.")

    if error:
        # Log the raw code and description: the user-facing text is deliberately
        # short, but the server output is where a misconfiguration gets diagnosed.
        logger.warning(
            "%s login failed: error=%s description=%s",
            provider.display_name,
            error,
            error_description,
        )
        return _frontend_redirect(
            "/", error=_describe_oauth_error(provider, error, error_description),
            provider=provider_name,
        )

    claims = decode_oauth_state(state) if state else None
    if not claims or claims.get("provider") != provider_name:
        # A missing or unsigned state means this callback did not start with us.
        return _frontend_redirect(
            "/", error="Login link expired. Please try again.", provider=provider_name
        )

    if not code:
        return _frontend_redirect(
            "/",
            error=f"{provider.display_name} did not return a login code.",
            provider=provider_name,
        )

    try:
        profile = await exchange_code_for_profile(provider, code)
        document = _upsert_social_user(provider_name, profile)
    except OAuthError as exc:
        return _frontend_redirect("/", error=str(exc), provider=provider_name)

    auth = _auth_response(document)
    return _frontend_redirect(
        claims.get("redirect_path", "/main"),
        token=auth.access_token,
        provider=provider_name,
    )


def _describe_oauth_error(provider, code: str, description: Optional[str]) -> str:
    """Turn a provider's OAuth error into something the user can act on.

    Only a real cancellation is reported as one — anything else says what the
    provider actually complained about, so a misconfigured app is not disguised
    as the user changing their mind.
    """
    if code in CANCELLED_CODES:
        return f"{provider.display_name} login was cancelled."

    if code in SCOPE_CODES:
        return (
            f"{provider.display_name} did not accept the permissions this app asked for "
            f"({provider.scope}). Enable the sign-in product on the "
            f"{provider.display_name} app so those scopes become available."
        )

    # Providers usually send a human-readable description; prefer it, and fall
    # back to the bare code so there is always something concrete to search for.
    if description:
        return f"{provider.display_name}: {description}"
    return f"{provider.display_name} rejected the login ({code})."


def _frontend_redirect(
    next_path: str,
    token: Optional[str] = None,
    error: Optional[str] = None,
    provider: Optional[str] = None,
) -> RedirectResponse:
    params = {"next": next_path}
    if token:
        params["token"] = token
    if error:
        params["error"] = error
    # Lets the frontend name the provider in the toast it shows on arrival.
    if provider:
        params["provider"] = provider
    return RedirectResponse(
        f"{FRONTEND_URL}{FRONTEND_CALLBACK_PATH}?{urlencode(params)}", status_code=307
    )


def _upsert_social_user(provider_name: str, profile: OAuthProfile) -> dict:
    """Find, link, or create the account behind a social profile."""
    now = _now()

    # Match on the provider's own account id first: it is stable even if the
    # user later changes the email address on that provider.
    document = users_collection.find_one({f"provider_ids.{provider_name}": profile.subject})

    if not document:
        document = users_collection.find_one({"email": profile.email})
        # Linking an unverified social email to an existing account would let
        # anyone who claims that address take the account over.
        if document and not profile.email_verified:
            raise OAuthError(
                f"Your {PROVIDERS[provider_name].display_name} email is not verified, so we cannot "
                "connect it to the existing account with that address."
            )

    if document:
        updates = {
            "updated_at": now,
            "last_login_at": now,
            f"provider_ids.{provider_name}": profile.subject,
        }
        # Fill in only what the account is missing; never overwrite what the
        # user set themselves.
        if profile.avatar_url and not document.get("avatar_url"):
            updates["avatar_url"] = profile.avatar_url
        if not document.get("full_name"):
            updates["full_name"] = profile.full_name
        if profile.email_verified:
            updates["email_verified"] = True

        users_collection.update_one(
            {"_id": document["_id"]},
            {"$set": updates, "$addToSet": {"auth_providers": provider_name}},
        )
        return users_collection.find_one({"_id": document["_id"]})

    new_user = UserInDB(
        full_name=profile.full_name,
        email=profile.email,
        password_hash=None,
        avatar_url=profile.avatar_url,
        email_verified=profile.email_verified,
        auth_providers=[provider_name],
        provider_ids={provider_name: profile.subject},
        last_login_at=now,
    ).model_dump()

    try:
        result = users_collection.insert_one(new_user)
    except DuplicateKeyError:
        # Raced with another login for the same email; that one won, use it.
        return users_collection.find_one({"email": profile.email})

    new_user["_id"] = result.inserted_id
    return new_user
