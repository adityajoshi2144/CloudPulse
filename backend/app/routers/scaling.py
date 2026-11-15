from fastapi import APIRouter, HTTPException
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
            "current_replicas": s_data.get("replicas"),
            "current_cpu": s_data.get("cpu_percent"),
            "scale_up_cooldown": settings.SCALE_UP_COOLDOWN_SEC,
            "scale_down_cooldown": settings.SCALE_DOWN_COOLDOWN_SEC,
            "is_hpa_active": False,
            "orchestrator": "Not integrated",
            "execution_mode": "policy_only",
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
        "status": "updated",
        "service_id": service_id,
        "execution_mode": "process_local_policy_only",
        "infrastructure_changed": False,
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
    raise HTTPException(
        status_code=501,
        detail="Manual replica changes are unavailable: no Kubernetes adapter is configured.",
    )
