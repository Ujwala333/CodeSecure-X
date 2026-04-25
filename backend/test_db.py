import asyncio
from models.user_model import User
from database.connection import get_client, get_database, MONGODB_URL
from beanie import init_beanie

async def test():
    print("Testing DB connection to:", MONGODB_URL)
    client = get_client()
    await init_beanie(database=get_database(), document_models=[User])
    print("Beanie init done.")
    try:
        user = User(username="test", email="test@test.com", hashed_password="pwd")
        await user.insert()
        print("Insert success")
    except Exception as e:
        print("ERROR:", type(e), e)

asyncio.run(test())
