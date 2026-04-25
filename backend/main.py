import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from beanie import init_beanie

from database.connection import get_client, get_database, MONGODB_URL
from models.scan_model import Scan
from models.report_model import Report
from models.user_model import User
from models.admin_log import AdminLog
from routes import scan, report, admin
from routes.github import router as github_router
from routes.auth import router as auth_router
from routers.dashboard import router as dashboard_router
from routers.profile import router as profile_router
from services.vulnerability_service import get_scan_history

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize Beanie ODM on startup."""
    logger.info("Connecting to MongoDB: %s", MONGODB_URL[:40] + "…")
    client = get_client()
    await init_beanie(
        database=get_database(),
        document_models=[Scan, Report, User, AdminLog],
    )
    logger.info("Beanie ODM initialised — collections: scans, reports, users")
    yield
    client.close()
    logger.info("MongoDB connection closed.")


app = FastAPI(
    title="SecureCodeAI API",
    description="LLM-powered code vulnerability scanner — backed by MongoDB + Nebius AI",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://code-secure-x.vercel.app",
    ],
    allow_origin_regex=(
        r"https://.*\.vercel\.app"
        r"|http://localhost:\d+"
        r"|http://127\.0\.0\.1:\d+"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth_router,     prefix="/api")
app.include_router(scan.router,     prefix="/api")
app.include_router(report.router,   prefix="/api")
app.include_router(admin.router,    prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(profile_router,  prefix="/api")
app.include_router(github_router,   prefix="/api")

# Compatibility aliases for frontend builds configured with the backend root
# URL instead of the `/api` base path.
app.include_router(auth_router)
app.include_router(scan.router)
app.include_router(report.router)
app.include_router(admin.router)
app.include_router(dashboard_router)
app.include_router(profile_router)
app.include_router(github_router)

STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# ─── Top-level alias /api/history ─────────────────────────────────────────────
@app.get("/api/history", tags=["Scan"])
async def history_alias(limit: int = 50):
    """Alias for /api/scan/history — convenience endpoint for the frontend."""
    return await get_scan_history(limit=min(limit, 200))


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "db": "mongodb", "version": "2.0.0"}
