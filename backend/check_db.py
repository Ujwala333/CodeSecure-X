import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from database.connection import get_database

async def main():
    db = get_database()
    
    print("--- SCANS TABLE ---")
    async for scan in db.scans.find().sort("created_at", -1).limit(5):
        print({ "id": str(scan.get("_id")), "user_id": str(scan.get("user_id")), "created_at": str(scan.get("created_at")) })
        
    print("\n--- REPORTS TABLE ---")
    async for rep in db.reports.find().sort("created_at", -1).limit(5):
        print({ "id": str(rep.get("_id")), "user_id": str(rep.get("user_id")), "scan_id": str(rep.get("scan_id")), "created_at": str(rep.get("created_at")) })

if __name__ == "__main__":
    asyncio.run(main())
