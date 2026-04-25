from pydantic import BaseModel


class ReportRequest(BaseModel):
    scan_id: str          # MongoDB ObjectId as string


class ReportResponse(BaseModel):
    report_id: str        # MongoDB ObjectId as string
    scan_id: str
    pdf_url: str
