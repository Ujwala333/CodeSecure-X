import asyncio
from database.connection import get_client, get_database
from models.report_model import Report
from models.scan_model import Scan
from beanie import init_beanie

async def main():
    client = get_client()
    await init_beanie(database=get_database(), document_models=[Report, Scan])
    report_count = await Report.find_all().count()
    scan_count = await Scan.find_all().count()
    print('reports', report_count)
    print('scans', scan_count)
    report = await Report.find_one()
    print('sample report', report)
    scan = await Scan.find_one()
    print('sample scan id', scan.id if scan else None)
    print('scan created', scan.created_at if scan else None)
    client.close()

asyncio.run(main())
