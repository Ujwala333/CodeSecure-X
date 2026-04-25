import asyncio
from models.user_model import User
from schemas.user_schema import RegisterRequest
from routes.auth import register
from database.connection import get_client, get_database, MONGODB_URL
from beanie import init_beanie

async def test():
    print("Testing DB connection to:", MONGODB_URL)
    client = get_client()
    await init_beanie(database=get_database(), document_models=[User])
    print("Beanie init done.")
    try:
        req = RegisterRequest(username="router_test", email="router@test.com", password="password123")
        res = await register(req)
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
