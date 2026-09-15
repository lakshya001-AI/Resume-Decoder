import logging

from pymongo import ASCENDING, MongoClient
from pymongo.errors import PyMongoError
from pymongo.server_api import ServerApi

from settings import get, require

logger = logging.getLogger("mongo")

# Credentials come from Backend/.env so they never live in source. See .env.example.
uri = require("MONGODB_URI")

# Fail a request in a few seconds rather than hanging on the driver's 30s
# default — a proxy in front of us would give up long before that anyway.
client = MongoClient(
    uri,
    server_api=ServerApi('1'),
    serverSelectionTimeoutMS=int(get("MONGO_TIMEOUT_MS", "8000")),
)

# create DB
db = client[get("MONGODB_DB", "trueOffer_ai_DB")]
# create collection
collection = db["trueOffer_ai_collection"]

# Users live in their own collection so the generic one above stays free for
# offer-letter documents.
users_collection = db["users"]

_indexes_ready = False


def ensure_indexes() -> bool:
    """Create the indexes the auth code relies on, tolerating an outage.

    Deliberately never raises: a database that is unreachable at boot must not
    stop the API starting, or a blip leaves the whole app dead rather than
    degraded. Callers retry until it sticks.
    """
    global _indexes_ready
    if _indexes_ready:
        return True

    try:
        # One account per email address. The unique index is what actually stops
        # two concurrent signups from creating duplicates.
        users_collection.create_index(
            [("email", ASCENDING)], unique=True, name="uniq_email"
        )
        # Social login looks users up by the provider's stable account id.
        users_collection.create_index(
            [("provider_ids.google", ASCENDING)], sparse=True, name="google_sub"
        )
    except PyMongoError as exc:
        logger.warning("Could not create indexes (database unreachable?): %s", exc)
        return False

    _indexes_ready = True
    logger.info("MongoDB indexes are in place.")
    return True


def ping() -> bool:
    """Whether the database is currently reachable."""
    try:
        client.admin.command("ping")
        return True
    except PyMongoError:
        return False
