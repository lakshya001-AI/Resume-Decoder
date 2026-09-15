import os

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Origins allowed to call this API from the browser: the Vite dev server by
# default, plus whatever FRONTEND_ORIGINS lists (comma-separated) in deployment.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
origins += [
    origin.strip()
    for origin in os.environ.get("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter(prefix="/api")


@router.get("/welcome")
async def welcome():
    return {"message":"This is a fastAPI server and doc backend"}



app.include_router(router)

