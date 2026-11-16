from fastapi import APIRouter, HTTPException
from app.services.rca_service import incident_service

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("")
async def get_incidents():
    return incident_service.get_incidents()

@router.post("/trigger-failure")
async def trigger_pod_failure(service_id: str = "order-service"):
    raise HTTPException(
        status_code=501,
        detail="Pod failure injection is unavailable. Use the bounded local test-target failure scenario in the simulator.",
    )

@router.post("/recover")
async def trigger_recovery(incident_id: str | None = None):
    raise HTTPException(
        status_code=501,
        detail="Automated service recovery is unavailable because no orchestrator adapter is configured.",
    )

@router.get("/{incident_id}/rca")
async def get_incident_rca(incident_id: str):
    rca = incident_service.get_rca(incident_id)
    if not rca:
        raise HTTPException(status_code=404, detail="Incident not found")
    return rca
