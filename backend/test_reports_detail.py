import asyncio
from beanie import init_beanie
from database.connection import get_client, get_database
from models.report_model import Report
from models.scan_model import Scan

async def main():
    client = get_client()
    try:
        await init_beanie(database=get_database(), document_models=[Report, Scan])
        
        # Fetch all reports with their scan data
        reports = await Report.find().sort(-Report.created_at).to_list()
        print(f"Total reports: {len(reports)}")
        
        for i, r in enumerate(reports[:3]):  # Check first 3
            print(f"\n--- Report {i+1} ---")
            print(f"Report ID: {r.id}")
            print(f"Scan ID: {r.scan_id}")
            print(f"PDF filename: {r.pdf_filename}")
            print(f"User ID: {r.user_id}")
            print(f"Created at: {r.created_at}")
            
            # Check if scan exists
            scan = await Scan.get(r.scan_id)
            if scan:
                print(f"Scan exists: True (user_id: {scan.user_id})")
            else:
                print(f"Scan exists: False")
    finally:
        client.close()

asyncio.run(main())
