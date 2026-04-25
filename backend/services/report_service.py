import os
import json
import logging
from datetime import datetime, timezone

from beanie import PydanticObjectId
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)

from models.scan_model import Scan
from models.report_model import Report
from schemas.report_schema import ReportResponse

logger = logging.getLogger(__name__)

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

SEVERITY_COLORS = {
    "Critical": colors.HexColor("#8B0000"),
    "High":     colors.HexColor("#CC0000"),
    "Medium":   colors.HexColor("#E6A817"),
    "Low":      colors.HexColor("#2E7D32"),
}


def _get_severity_color(severity: str) -> colors.Color:
    return SEVERITY_COLORS.get(severity, colors.black)


async def generate_pdf_report(scan_id: str, user_id: str | None = None) -> ReportResponse:
    """
    Fetch the Scan from MongoDB, build a PDF, persist a Report document.
    Returns ReportResponse with report_id and PDF download URL.
    """
    scan = await Scan.get(PydanticObjectId(scan_id))
    if scan is None:
        raise ValueError(f"Scan with id={scan_id} not found")

    try:
        vulns: list[dict] = json.loads(scan.vulnerabilities_json or "[]")
    except json.JSONDecodeError:
        vulns = []

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename  = f"report_scan{scan_id}_{timestamp}.pdf"
    filepath  = os.path.join(REPORTS_DIR, filename)

    _build_pdf(filepath, scan_id, scan.language, vulns, scan.created_at)

    report = Report(
        scan_id=scan.id, 
        pdf_filename=filename,
        user_id=PydanticObjectId(user_id) if user_id else None
    )
    await report.insert()

    return ReportResponse(
        report_id=str(report.id),
        scan_id=scan_id,
        pdf_url=f"/report/{report.id}",
    )


# ─── PDF builder (unchanged layout) ──────────────────────────────────────────

def _build_pdf(
    filepath: str,
    scan_id: str,
    language: str,
    vulns: list[dict],
    scan_time: datetime,
) -> None:
    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Heading1"],
        fontSize=20, textColor=colors.HexColor("#1A237E"), spaceAfter=6)
    sub_style = ParagraphStyle("Sub", parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor("#555555"))
    section_style = ParagraphStyle("Section", parent=styles["Heading2"],
        fontSize=13, textColor=colors.HexColor("#1A237E"), spaceBefore=12, spaceAfter=6)
    body_style = styles["Normal"]

    story = []

    story.append(Paragraph("🔒 CodeSecureX — Security Scan Report", title_style))
    story.append(Paragraph(
        f"Scan ID: {scan_id} &nbsp;|&nbsp; Language: {language} "
        f"&nbsp;|&nbsp; Generated: {scan_time.strftime('%Y-%m-%d %H:%M')} UTC",
        sub_style,
    ))
    story.append(HRFlowable(width="100%", thickness=1,
        color=colors.HexColor("#1A237E"), spaceAfter=12))

    story.append(Paragraph("Executive Summary", section_style))
    if not vulns:
        story.append(Paragraph("✅ No vulnerabilities were detected.", body_style))
    else:
        counts: dict[str, int] = {}
        for v in vulns:
            sev = v.get("severity", "Low")
            counts[sev] = counts.get(sev, 0) + 1
        summary_text = (
            f"Found <b>{len(vulns)}</b> vulnerability/vulnerabilities: "
            + ", ".join(f"<b>{cnt} {sev}</b>" for sev, cnt in counts.items())
        )
        story.append(Paragraph(summary_text, body_style))

    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph("Vulnerability Details", section_style))

    if not vulns:
        story.append(Paragraph("No issues found.", body_style))
    else:
        for idx, vuln in enumerate(vulns, 1):
            sev = vuln.get("severity", "Low")
            # Wrap long strings in Paragraph so ReportLab table can wrap the text
            data = [
                ["#", str(idx)],
                ["Type", Paragraph(vuln.get("type", "—"), body_style)],
                ["Severity", sev],
                ["Explanation", Paragraph(vuln.get("explanation", "—").replace("\n", "<br/>"), body_style)],
                ["Fix", Paragraph(vuln.get("fix", "—").replace("\n", "<br/>"), body_style)],
            ]
            table = Table(data, colWidths=[3*cm, 13*cm])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EEEEEE")),
                ("TEXTCOLOR",  (1, 2), (1, 2), _get_severity_color(sev)),
                ("FONTNAME",   (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE",   (0, 0), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#F9F9F9")]),
                ("BOX",        (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
                ("INNERGRID",  (0, 0), (-1, -1), 0.25, colors.HexColor("#DDDDDD")),
                ("VALIGN",     (0, 0), (-1, -1), "TOP"),
            ]))
            story.append(table)
            story.append(Spacer(1, 0.3*cm))

    story.append(HRFlowable(width="100%", thickness=0.5,
        color=colors.grey, spaceBefore=12))
    story.append(Paragraph(
        "Generated by <b>CodeSecureX</b> — LLM-Based Vulnerability Scanner", sub_style))

    doc.build(story)
    logger.info("PDF saved: %s", filepath)
