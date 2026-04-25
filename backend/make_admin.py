import asyncio
import sys
from beanie import init_beanie
from database.connection import get_client, get_database
from models.user_model import User
from models.scan_model import Scan
from models.report_model import Report


async def make_admin(email: str | None = None):
    client = get_client()
    await init_beanie(database=get_database(), document_models=[Scan, Report, User])

    user = (
        await User.find_one(User.email == email)
        if email
        else await User.find_one()
    )

    if user is None:
        msg = f"No user found with email '{email}'." if email else "No users found in the database."
        print(msg)
    else:
        user.role = "admin"
        await user.save()
        print(f"✅ User '{user.email}' is now an admin.")

    client.close()


if __name__ == "__main__":
    target_email = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(make_admin(target_email))
