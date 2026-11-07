import time
import random
from datetime import datetime
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
    
    svc = telemetry_state.services[service_id]
    svc["restart_count"] += 1
    svc["status"] = "healthy"
    svc["error_rate"] = 0.01
    
    # Restart pods
    for pod in telemetry_state.pods.get(service_id, []):
        pod["status"] = "Running"
        pod["ready"] = True
        pod["restarts"] += 1
        pod["uptime_seconds"] = 1
        pod["cpu_percent"] = 28.0

    if telemetry_state.failing_service_id == service_id:
        telemetry_state.failing_service_id = None
        telemetry_state.failed_pod_id = None

    return {
        "status": "success",
        "message": f"Rolling restart completed for {service_id}",
        "restarted_pods": len(telemetry_state.pods.get(service_id, []))
    }

@router.get("/{service_id}/logs")
async def get_service_logs(service_id: str):
    if service_id not in telemetry_state.services:
        raise HTTPException(status_code=404, detail=f"Service '{service_id}' not found")
    
    svc = telemetry_state.services[service_id]
    now_str = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    
    # Generate realistic structured logs
    logs = [
        {"timestamp": now_str, "level": "INFO", "component": service_id, "message": f"HTTP GET /healthz 200 OK (0.8ms)"},
        {"timestamp": now_str, "level": "INFO", "component": service_id, "message": f"Connection pool active: 14 connections, idle: 6"},
        {"timestamp": now_str, "level": "DEBUG", "component": service_id, "message": f"Worker threads executing request batches [count={int(svc['rps'])}]"},
    ]
    if svc["status"] == "critical":
        logs.insert(0, {"timestamp": now_str, "level": "ERROR", "component": service_id, "message": f"Unhandled worker exception: ConnectionResetError during upstream call"})
        logs.insert(1, {"timestamp": now_str, "level": "CRITICAL", "component": service_id, "message": f"Health check failed: Pod readiness probe timeout (3000ms)"})
    elif svc["status"] == "degraded":
        logs.insert(0, {"timestamp": now_str, "level": "WARN", "component": service_id, "message": f"High latency warning: p95 latency reached {svc['latency_p95']}ms"})
    
    return {"service_id": service_id, "logs": logs}
