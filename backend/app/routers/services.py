from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.core.telemetry_state import telemetry_state

router = APIRouter(prefix="/services", tags=["Services"])

@router.get("", response_model=List[Dict[str, Any]])
async def list_services():
    return list(telemetry_state.services.values())

@router.get("/{service_id}")
async def get_service_detail(service_id: str):
    if service_id not in telemetry_state.services:
        raise HTTPException(status_code=404, detail=f"Service '{service_id}' not found")
    
    svc = dict(telemetry_state.services[service_id])
    pods = telemetry_state.pods.get(service_id, [])
    svc["pods"] = pods
    return svc

@router.post("/{service_id}/restart")
async def restart_service(service_id: str):
    if service_id not in telemetry_state.services:
        raise HTTPException(status_code=404, detail=f"Service '{service_id}' not found")
    raise HTTPException(
        status_code=501,
        detail="Service restart is unavailable: no orchestrator adapter is configured.",
    )

@router.get("/{service_id}/logs")
async def get_service_logs(service_id: str):
    if service_id not in telemetry_state.services:
        raise HTTPException(status_code=404, detail=f"Service '{service_id}' not found")
    
    return {
        "service_id": service_id,
        "available": False,
        "message": "Service logs are unavailable because no log aggregation integration is configured.",
        "logs": [],
    }
