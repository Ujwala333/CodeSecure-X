"""One-off script — reset a user's password in MongoDB."""

import asyncio
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from models.user_model import User
from utils.security import hash_password


async def main() -> None:
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name   = os.getenv("MONGODB_DB_NAME", "securecodeai")

    client = AsyncIOMotorClient(mongo_url)
    await init_beanie(database=client[db_name], document_models=[User])

    email    = input("Email to reset: ").strip()
    new_pass = input("New password:   ").strip()

    user = await User.find_one(User.email == email)
    if not user:
        print(f"❌ No user found with email '{email}'")
        return

    user.password_hash = hash_password(new_pass)
    await user.save()
    print(f"✅ Password for '{email}' has been reset successfully.")


if __name__ == "__main__":
    asyncio.run(main())
