from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("")
async def list_reports():
    return {
        "persistence": "process-local; reports are cleared when the API restarts",
        "reports": report_service.list_reports(),
    }


@router.get("/{report_id}")
async def get_report(report_id: str):
    report = report_service.get_report(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Simulation report not found.")
    return report


@router.get("/{report_id}/csv")
async def download_csv(report_id: str):
    report = report_service.get_report(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Simulation report not found.")
    return Response(
        content=report_service.to_csv(report),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="cloudpulse-{report_id}.csv"'},
    )


@router.get("/{report_id}/pdf")
async def download_pdf(report_id: str):
    report = report_service.get_report(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Simulation report not found.")
    return Response(
        content=report_service.to_pdf(report),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="cloudpulse-{report_id}.pdf"'},
    )
