import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from MongoDB.configuration import ensure_indexes, ping
from routes.auth_routes import router as auth_router
from settings import get

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Best-effort: a database that is down at boot must not stop the API
    # starting, or every endpoint dies with it — including the ones that would
    # tell you what is wrong.
    if not ensure_indexes():
        logger.warning(
            "Starting without MongoDB. Endpoints that need it will return 503 "
            "until it is reachable; check /api/health."
        )
    yield


app = FastAPI(lifespan=lifespan)

# Origins allowed to call this API from the browser: the Vite dev server by
# default, plus whatever FRONTEND_ORIGINS lists (comma-separated) in deployment.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
origins += [
    origin.strip()
    for origin in (get("FRONTEND_ORIGINS", "") or "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(PyMongoError)
async def database_unavailable(request: Request, exc: PyMongoError):
    """Turn a driver-level failure into an honest 503 rather than a bare 500."""
    logger.error("Database error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "The database is unavailable right now. Please try again shortly."},
    )


router = APIRouter(prefix="/api")


@router.get("/welcome")
async def welcome():
    return {"message":"This is a fastAPI server and doc backend"}


@router.get("/health")
async def health():
    """Liveness plus database reachability, for exactly this kind of debugging."""
    database_ok = ping()
    if database_ok:
        # A reconnect is a good moment to put any missing indexes in place.
        ensure_indexes()
    return JSONResponse(
        status_code=200 if database_ok else 503,
        content={"status": "ok" if database_ok else "degraded", "database": database_ok},
    )


router.include_router(auth_router)

app.include_router(router)
