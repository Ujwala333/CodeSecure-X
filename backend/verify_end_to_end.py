import asyncio
import json
from fastapi.testclient import TestClient
from main import app
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from models.user_model import User
from models.scan_model import Scan
from models.report_model import Report
from utils.security import create_access_token
from utils.config import settings

client = TestClient(app)

async def setup():
    db_client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(database=db_client.code_secure_x, document_models=[User, Scan, Report])
    
    # create navya
    navya = await User.find_one(User.email == "navyasree@gmail.com")
    if not navya:
        navya = User(username="navyasree", email="navyasree@gmail.com", hashed_password="hashed_pw", role="admin")
        await navya.insert()
        print(f"Created user: {navya.id}")
    else:
        print(f"Found user: {navya.id}")

    # make token
    token = create_access_token({"sub": str(navya.id)})
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n--- 1. Testing SCAN CREATE ---")
    res = client.post("/api/scan/analyze", json={"code": "print('hello')", "language": "python"}, headers=headers)
    print("Scan status:", res.status_code)
    scan_id = res.json().get("scan_id")
    print("Scan ID:", scan_id)
    
    print("\n--- 2. Testing REPORT CREATE ---")
    res_rep = client.post("/api/report/generate", json={"scan_id": scan_id}, headers=headers)
    print("Report status:", res_rep.status_code)
    report_id = res_rep.json().get("report_id")
    print("Report ID:", report_id)
    
    print("\n--- 3. Testing ADMIN REPORTS ---")
    res_adm = client.get("/api/admin/reports", headers=headers)
    print("Admin Reports Status:", res_adm.status_code)
    reports = res_adm.json().get("reports", [])
    if reports:
        print("Latest report email:", reports[0].get("user_email"))
        print("Raw report obj:", reports[0])
    
    print("\n--- 4. Directly outputting NEW DB rows ---")
    scan = await Scan.get(scan_id)
    print("DB SCAN user_id:", getattr(scan, "user_id", None))
    
    if report_id:
        rep = await Report.get(report_id)
        print("DB REPORT user_id:", getattr(rep, "user_id", None))

asyncio.run(setup())
