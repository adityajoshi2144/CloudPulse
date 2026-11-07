import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.core.telemetry_state import telemetry_state

class IncidentService:
    def __init__(self):
        self.incidents: List[Dict[str, Any]] = [
            {
                "id": "INC-2026-089",
                "title": "Payment Adapter Latency Degradation",
                "severity": "P2",
                "status": "resolved",
                "affected_services": ["payment-service", "order-service"],
                "started_at": "2026-11-07 18:24:10",
                "resolved_at": "2026-11-07 18:38:45",
                "duration_minutes": 14.5,
                "probable_cause": "External upstream webhook timeout causing worker thread starvation in payment-service container pool.",
                "impact_summary": "120 checkout requests experienced latency > 500ms; overall error rate remained below 0.8%.",
                "recommended_action": "Enable payment webhook circuit breaker and increase downstream timeout thresholds.",
                "rca": {
                    "primary_cause": "Downstream Payment Provider Timeout",
                    "confidence_score": 92.4,
                    "evidence": [
                        "payment-service p95 latency spiked from 45ms to 820ms at 18:24:15",
                        "TCP connection pool saturation observed in pod payment-service-581902",
                        "Upstream order-service queue depth increased by 310%"
                    ],
                    "timeline_events": [
                        {"time": "18:24:10", "event": "External gateway latency spike detected"},
                        {"time": "18:26:00", "event": "Alert 'payment-latency-p95-high' triggered"},
                        {"time": "18:28:30", "event": "Circuit breaker automatically tripped into half-open state"},
                        {"time": "18:38:45", "event": "External provider recovered; normal latency restored"}
                    ]
                }
            }
        ]

    def get_incidents(self) -> List[Dict[str, Any]]:
        return self.incidents

    def trigger_pod_failure(self, service_id: str = "order-service") -> Dict[str, Any]:
        """Simulates a controlled pod crash / failure scenario."""
        if service_id not in telemetry_state.services:
            service_id = "order-service"

        # Mark pod as failed in telemetry state
        pods = telemetry_state.pods.get(service_id, [])
        if pods:
            failed_pod = pods[0]
            failed_pod["status"] = "CrashLoopBackOff"
            failed_pod["ready"] = False
            failed_pod["restarts"] += 1
            telemetry_state.failed_pod_id = failed_pod["id"]
        
        telemetry_state.failing_service_id = service_id
        telemetry_state.services[service_id]["status"] = "critical"
        telemetry_state.services[service_id]["error_rate"] = 14.8
        telemetry_state.services[service_id]["latency_p95"] = 420.0

        # Create active incident
        incident_id = f"INC-2026-{len(self.incidents) + 90}"
        new_inc = {
            "id": incident_id,
            "title": f"Critical Pod CrashLoopBackOff on {service_id}",
            "severity": "P1",
            "status": "active",
            "affected_services": [service_id, "api-gateway"],
            "started_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "resolved_at": None,
            "duration_minutes": 0.5,
            "probable_cause": f"OOMKilled / Unhandled Exception causing container exit in {service_id} pod replica.",
            "impact_summary": f"{service_id} availability degraded; error rate surged to 14.8% on edge routes.",
            "recommended_action": f"Trigger automated self-healing restart or scale replacement replica to restore cluster quorum.",
            "rca": {
                "primary_cause": f"Container Process Crash ({service_id})",
                "confidence_score": 96.8,
                "evidence": [
                    f"Pod {telemetry_state.failed_pod_id} transitioned from Running to CrashLoopBackOff",
                    f"HTTP 502/503 errors on route /api/v1/{service_id}",
                    "Readiness probe failed consecutive checks (3/3)"
                ],
                "timeline_events": [
                    {"time": datetime.utcnow().strftime("%H:%M:%S"), "event": f"Process exited with non-zero code in {service_id}"},
                    {"time": datetime.utcnow().strftime("%H:%M:%S"), "event": "Kubelet triggered restart policy BackOff"}
                ]
            }
        }
        self.incidents.insert(0, new_inc)
        return new_inc

    def trigger_recovery(self, incident_id: Optional[str] = None) -> Dict[str, Any]:
        """Heals failed pod and restores service health."""
        if telemetry_state.failing_service_id:
            s_id = telemetry_state.failing_service_id
            telemetry_state.services[s_id]["status"] = "healthy"
            telemetry_state.services[s_id]["error_rate"] = 0.02
            telemetry_state.services[s_id]["latency_p95"] = 35.0
            
            # Heal pods
            for p in telemetry_state.pods.get(s_id, []):
                p["status"] = "Running"
                p["ready"] = True
                p["cpu_percent"] = 36.5
            
            telemetry_state.failed_pod_id = None
            telemetry_state.failing_service_id = None

        # Resolve active incident
        for inc in self.incidents:
            if inc["status"] == "active" and (not incident_id or inc["id"] == incident_id):
                inc["status"] = "resolved"
                inc["resolved_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
                inc["rca"]["timeline_events"].append({
                    "time": datetime.utcnow().strftime("%H:%M:%S"),
                    "event": "Self-healing reconciliation completed; healthy replica scheduled"
                })
                return inc

        return {"status": "ok", "message": "Cluster in healthy state"}

incident_service = IncidentService()
