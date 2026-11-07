from fastapi import APIRouter, HTTPException
from typing import Optional
from app.services.rca_service import incident_service

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("")
async def get_incidents():
    return incident_service.get_incidents()

@router.post("/trigger-failure")
async def trigger_pod_failure(service_id: str = "order-service"):
    incident = incident_service.trigger_pod_failure(service_id)
    return {
        "status": "failure_injected",
        "incident": incident
    }

@router.post("/recover")
async def trigger_recovery(incident_id: Optional[str] = None):
    res = incident_service.trigger_recovery(incident_id)
    return {
        "status": "recovery_initiated",
        "result": res
    }

@router.get("/{incident_id}/rca")
async def get_incident_rca(incident_id: str):
    for inc in incident_service.get_incidents():
        if inc["id"] == incident_id:
            return inc.get("rca", {})
    raise HTTPException(status_code=404, detail="Incident not found")
