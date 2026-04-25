import asyncio
import json
import os
from datetime import datetime, timezone
from beanie import init_beanie, PydanticObjectId
from database.connection import get_client, get_database
from models.scan_model import Scan
from models.report_model import Report

async def main():
    client = get_client()
    try:
        await init_beanie(database=get_database(), document_models=[Scan, Report])
        
        # Count scans
        scans = await Scan.find_all().to_list()
        print(f"Total scans: {len(scans)}")
        
        if scans:
            s = scans[0]
            print(f"First scan ID: {s.id}")
            print(f"Scan created: {s.created_at}")
            print(f"Language: {s.language}")
            print(f"Vulnerabilities JSON length: {len(s.vulnerabilities_json or '')}")
            
            # Test report generation
            try:
                from services.report_service import generate_pdf_report, REPORTS_DIR
                print(f"Reports directory: {REPORTS_DIR}")
                print(f"Reports dir exists: {os.path.exists(REPORTS_DIR)}")
                
                result = await generate_pdf_report(str(s.id))
                print(f"Report generated: {result.report_id}")
                print(f"Report PDF URL: {result.pdf_url}")
                
                # Check if PDF file exists
                report = await Report.get(PydanticObjectId(result.report_id))
                pdf_path = os.path.join(REPORTS_DIR, report.pdf_filename)
                print(f"PDF path: {pdf_path}")
                print(f"PDF exists: {os.path.isfile(pdf_path)}")
                print(f"PDF size: {os.path.getsize(pdf_path) if os.path.isfile(pdf_path) else 'N/A'}")
            except Exception as e:
                print(f"Report generation error: {type(e).__name__}: {e}")
        else:
            print("No scans found in database!")
        
        # Check reports count
        reports = await Report.find_all().to_list()
        print(f"Total reports: {len(reports)}")
    finally:
        client.close()

asyncio.run(main())
