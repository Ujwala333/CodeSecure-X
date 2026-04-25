import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(".env")

async def debug_users():
    uri = os.getenv("MONGODB_URL", "mongodb://localhost:27017/securecodeai")
    client = AsyncIOMotorClient(uri)
    db = client.securecodeai
    users = await db.users.find().to_list(10)
    for u in users:
        print(f"ID: {u.get('_id')} | Username: {u.get('username')} | Email: {u.get('email')} | FullName: {u.get('full_name')}")

if __name__ == "__main__":
    asyncio.run(debug_users())
