from datetime import datetime
from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/audit", tags=["Audit"])

audit_logs: List[Dict[str, Any]] = [
    {
        "id": 1,
        "timestamp": "2026-11-07 19:22:15",
        "operator": "devops.lead@cloudpulse.internal",
        "action": "CONFIG_UPDATE",
        "resource_type": "HPA_POLICY",
        "resource_id": "order-service",
        "details": {"previous_target_cpu": 75, "new_target_cpu": 70}
    },
    {
        "id": 2,
        "timestamp": "2026-11-07 18:35:40",
        "operator": "sre.oncall@cloudpulse.internal",
        "action": "INCIDENT_ACKNOWLEDGE",
        "resource_type": "INCIDENT",
        "resource_id": "INC-2026-089",
        "details": {"severity": "P2", "action": "triaged"}
    },
    {
        "id": 3,
        "timestamp": "2026-11-07 17:10:02",
        "operator": "automation-controller",
        "action": "SCALE_OUT",
        "resource_type": "K8S_DEPLOYMENT",
        "resource_id": "api-gateway",
        "details": {"from": 2, "to": 3, "trigger": "traffic_surge"}
    }
]

@router.get("")
async def get_audit_logs():
    return audit_logs

@router.post("")
async def log_action(log_data: Dict[str, Any]):
    new_entry = {
        "id": len(audit_logs) + 1,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "operator": log_data.get("operator", "admin@cloudpulse.internal"),
        "action": log_data.get("action", "USER_ACTION"),
        "resource_type": log_data.get("resource_type", "SYSTEM"),
        "resource_id": log_data.get("resource_id", "GLOBAL"),
        "details": log_data.get("details", {})
    }
    audit_logs.insert(0, new_entry)
    return new_entry
