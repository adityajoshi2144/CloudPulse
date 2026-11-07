from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models.entities import AlertThresholdConfig
from app.core.telemetry_state import telemetry_state

router = APIRouter(prefix="/alerts", tags=["Alerts"])

# In-memory alerts registry
active_alerts = [
    {
        "id": "ALT-1092",
        "service_id": "order-service",
        "service_name": "Order Processing Core",
        "metric": "CPU Utilization",
        "threshold": 75.0,
        "current_value": 78.4,
        "severity": "warning",
        "status": "firing",
        "triggered_at": "2026-11-07 19:10:22",
        "message": "Average pod CPU utilization exceeded warning threshold (75.0%)"
    },
    {
        "id": "ALT-1090",
        "service_id": "api-gateway",
        "service_name": "API Gateway",
        "metric": "p95 Latency",
        "threshold": 50.0,
        "current_value": 52.8,
        "severity": "warning",
        "status": "acknowledged",
        "triggered_at": "2026-11-07 18:45:10",
        "acknowledged_at": "2026-11-07 18:50:00",
        "message": "Edge ingress p95 latency transient threshold breach"
    }
]

alert_thresholds = [
    {"metric": "CPU Utilization", "unit": "%", "warning_threshold": 75.0, "critical_threshold": 88.0, "enabled": True},
    {"metric": "Memory Utilization", "unit": "%", "warning_threshold": 80.0, "critical_threshold": 92.0, "enabled": True},
    {"metric": "P95 Latency", "unit": "ms", "warning_threshold": 60.0, "critical_threshold": 150.0, "enabled": True},
    {"metric": "HTTP Error Rate", "unit": "%", "warning_threshold": 2.0, "critical_threshold": 5.0, "enabled": True}
]

@router.get("")
async def get_alerts():
    # Dynamically inject critical alert if chaos is active
    dynamic_list = list(active_alerts)
    if telemetry_state.failing_service_id:
        s_id = telemetry_state.failing_service_id
        svc = telemetry_state.services.get(s_id, {})
        dynamic_list.insert(0, {
            "id": f"ALT-CRIT-{s_id}",
            "service_id": s_id,
            "service_name": svc.get("name", s_id),
            "metric": "HTTP Error Rate",
            "threshold": 5.0,
            "current_value": svc.get("error_rate", 14.8),
            "severity": "critical",
            "status": "firing",
            "triggered_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "message": f"Critical pod crash and error surge on {s_id}"
        })
    return dynamic_list

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    for a in active_alerts:
        if a["id"] == alert_id:
            a["status"] = "acknowledged"
            a["acknowledged_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            return {"status": "success", "alert": a}
    return {"status": "ok", "message": "Alert acknowledged"}

@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    for a in active_alerts:
        if a["id"] == alert_id:
            a["status"] = "resolved"
            a["resolved_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            return {"status": "success", "alert": a}
    return {"status": "ok", "message": "Alert marked resolved"}

@router.get("/thresholds")
async def get_thresholds():
    return alert_thresholds

@router.post("/thresholds")
async def update_thresholds(configs: List[AlertThresholdConfig]):
    global alert_thresholds
    for cfg in configs:
        for t in alert_thresholds:
            if t["metric"] == cfg.metric:
                t["warning_threshold"] = cfg.warning_threshold
                t["critical_threshold"] = cfg.critical_threshold
                t["enabled"] = cfg.enabled
    return alert_thresholds
