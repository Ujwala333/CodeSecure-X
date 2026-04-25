import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Explicitly load backend/.env relative to this file's location
ENV_PATH = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=ENV_PATH, override=True)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/securecodeai")

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGODB_URL)
    return _client


def get_database():
    """Return the default database from the connection string, or a fallback."""
    client = get_client()
    try:
        return client.get_default_database()
    except Exception:
        # Fallback if the URL doesn't include a database name
        # (e.g. mongodb+srv://...mongodb.net/ instead of mongodb+srv://...mongodb.net/securecodeai)
        return client.get_database("securecodeai")
