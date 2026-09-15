from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlencode

import httpx

from settings import get

# Where the browser lands after we finish the social round-trip. The frontend
# route at this path pulls the token out of the query string.
FRONTEND_URL = get("FRONTEND_URL", "http://localhost:5173").rstrip("/")
# Public base URL of *this* API. Must match the redirect URI registered with
# Google exactly, including scheme and port.
BACKEND_URL = get("BACKEND_URL", "http://127.0.0.1:8000").rstrip("/")


class OAuthError(Exception):
    """Raised when a provider rejects us or returns something unusable."""


@dataclass(frozen=True)
class OAuthProfile:
    """The provider-agnostic slice of a social profile we actually store."""

    subject: str
    email: str
    full_name: str
    avatar_url: Optional[str]
    email_verified: bool


@dataclass(frozen=True)
class OAuthProvider:
    name: str
    # How the provider spells its own name in UI text, which name.title() does
    # not always get right (e.g. "LinkedIn", "GitHub").
    display_name: str
    authorize_url: str
    token_url: str
    userinfo_url: str
    scope: str
    client_id: Optional[str]
    client_secret: Optional[str]

    @property
    def configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    @property
    def redirect_uri(self) -> str:
        return f"{BACKEND_URL}/api/auth/{self.name}/callback"


# Keyed by provider name and driven entirely by this table, so adding another
# OpenID Connect provider is a matter of one more entry — no new code path.
PROVIDERS: dict[str, OAuthProvider] = {
    "google": OAuthProvider(
        name="google",
        display_name="Google",
        authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
        token_url="https://oauth2.googleapis.com/token",
        userinfo_url="https://openidconnect.googleapis.com/v1/userinfo",
        scope="openid email profile",
        client_id=get("GOOGLE_CLIENT_ID"),
        client_secret=get("GOOGLE_CLIENT_SECRET"),
    ),
}


def build_authorize_url(provider: OAuthProvider, state: str) -> str:
    params = {
        "response_type": "code",
        "client_id": provider.client_id,
        "redirect_uri": provider.redirect_uri,
        "scope": provider.scope,
        "state": state,
    }
    if provider.name == "google":
        # Always show the account chooser rather than silently reusing whichever
        # Google account the browser happens to be signed into.
        params["prompt"] = "select_account"
    return f"{provider.authorize_url}?{urlencode(params)}"


async def exchange_code_for_profile(provider: OAuthProvider, code: str) -> OAuthProfile:
    """Trade an authorization code for the user's profile."""
    async with httpx.AsyncClient(timeout=15) as http:
        token_response = await http.post(
            provider.token_url,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": provider.redirect_uri,
                "client_id": provider.client_id,
                "client_secret": provider.client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_response.status_code != 200:
            raise OAuthError(f"{provider.name} rejected the authorization code.")

        access_token = token_response.json().get("access_token")
        if not access_token:
            raise OAuthError(f"{provider.name} did not return an access token.")

        userinfo_response = await http.get(
            provider.userinfo_url,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_response.status_code != 200:
            raise OAuthError(f"Could not read your {provider.name} profile.")

    return _to_profile(provider, userinfo_response.json())


def _to_profile(provider: OAuthProvider, userinfo: dict) -> OAuthProfile:
    subject = userinfo.get("sub")
    email = (userinfo.get("email") or "").strip().lower()
    if not subject or not email:
        raise OAuthError(
            f"Your {provider.name} account did not share an email address, "
            "so we cannot sign you in with it."
        )

    full_name = (
        userinfo.get("name")
        or " ".join(
            part
            for part in (userinfo.get("given_name"), userinfo.get("family_name"))
            if part
        ).strip()
        or email.split("@")[0]
    )

    return OAuthProfile(
        subject=subject,
        email=email,
        full_name=full_name,
        avatar_url=userinfo.get("picture"),
        email_verified=bool(userinfo.get("email_verified", False)),
    )
