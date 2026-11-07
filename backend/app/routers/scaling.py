from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models.entities import ScalingPolicyUpdate
from app.core.telemetry_state import telemetry_state
from app.services.autoscaler import autoscaler_service
from app.core.config import settings

router = APIRouter(prefix="/scaling", tags=["AutoScaling"])

@router.get("/policies")
async def get_scaling_policies():
    policies = []
    for s_id, s_data in telemetry_state.services.items():
        if s_id in ["postgres-db", "redis-cache"]:
            continue
        policies.append({
            "service_id": s_id,
            "service_name": s_data["name"],
            "target_cpu": s_data.get("target_cpu", 70),
            "min_replicas": s_data.get("min_replicas", 2),
            "max_replicas": s_data.get("max_replicas", 10),
            "current_replicas": len(telemetry_state.pods.get(s_id, [])),
            "current_cpu": s_data.get("cpu_percent", 35.0),
            "scale_up_cooldown": settings.SCALE_UP_COOLDOWN_SEC,
            "scale_down_cooldown": settings.SCALE_DOWN_COOLDOWN_SEC,
            "is_hpa_active": True,
            "orchestrator": "Kubernetes HPA (v2)" if settings.KUBERNETES_ENABLED else "CloudPulse Native HPA Engine"
        })
    return policies

@router.put("/policies/{service_id}")
async def update_scaling_policy(service_id: str, policy: ScalingPolicyUpdate):
    if service_id not in telemetry_state.services:
        raise HTTPException(status_code=404, detail="Service not found")
    
    svc = telemetry_state.services[service_id]
    svc["target_cpu"] = policy.target_cpu
    svc["min_replicas"] = policy.min_replicas
    svc["max_replicas"] = policy.max_replicas
    
    return {
        "status": "success",
        "service_id": service_id,
        "policy": {
            "target_cpu": svc["target_cpu"],
            "min_replicas": svc["min_replicas"],
            "max_replicas": svc["max_replicas"]
        }
    }

@router.get("/events")
async def get_scaling_events():
    return autoscaler_service.scaling_events

@router.post("/manual")
async def trigger_manual_scale(service_id: str, replicas: int):
    try:
        event = autoscaler_service.manual_scale(service_id, replicas, operator="UI Operator")
        return {"status": "success", "event": event}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
