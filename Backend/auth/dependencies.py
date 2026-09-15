from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from MongoDB.configuration import users_collection
from MongoDB.models import UserPublic, to_public

from .security import decode_access_token

# auto_error=False so a missing header produces our own 401 shape rather than
# FastAPI's default 403.
bearer_scheme = HTTPBearer(auto_error=False)

_UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Your session has expired. Please log in again.",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> UserPublic:
    """Resolve the bearer token on the request into a user, or reject it.

    The user is re-read from Mongo on every call so that a deleted account stops
    working immediately instead of lingering until its token expires.
    """
    if credentials is None or not credentials.credentials:
        raise _UNAUTHORIZED

    claims = decode_access_token(credentials.credentials)
    if not claims:
        raise _UNAUTHORIZED

    try:
        user_id = ObjectId(claims["sub"])
    except (KeyError, TypeError, InvalidId):
        raise _UNAUTHORIZED

    document = users_collection.find_one({"_id": user_id})
    if not document:
        raise _UNAUTHORIZED

    return to_public(document)
