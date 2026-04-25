import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(".env")

async def fix_orphaned_records():
    uri = os.getenv("MONGODB_URL", "mongodb://localhost:27017/securecodeai")
    client = AsyncIOMotorClient(uri)
    db = client.securecodeai
    
    # Get the ACTUAL admin user
    admin_user = await db.users.find_one({"email": "navyasree@gmail.com"})
    if not admin_user:
        print("Navyasree not found!")
        return
        
    admin_id = admin_user["_id"]
    test_id = (await db.users.find_one({"email": "test@test.com"}))["_id"]
    
    # Switch ALL records that I accidentally assigned to test_id over to admin_id
    result_scans = await db.scans.update_many(
        {"user_id": str(test_id)},
        {"$set": {"user_id": str(admin_id)}}
    )
    print(f"Fixed {result_scans.modified_count} Scans.")
    
    result_reports = await db.reports.update_many(
        {"user_id": str(test_id)},
        {"$set": {"user_id": str(admin_id)}}
    )
    print(f"Fixed {result_reports.modified_count} Reports.")

if __name__ == "__main__":
    asyncio.run(fix_orphaned_records())
