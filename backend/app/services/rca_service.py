from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List


class IncidentService:
    """
    CloudPulse Incident Management and Root Cause Analysis (RCA) Service.
    
    Tracks detected security and operational incidents, correlation evidence,
    mitigation actions, and automated root cause analysis.
    """

    def __init__(self) -> None:
        self.incidents: List[Dict[str, Any]] = []

    def get_incidents(self) -> List[Dict[str, Any]]:
        return list(self.incidents)

    def create_incident(
        self,
        incident_id: str,
        title: str,
        severity: str = "P1-Critical",
        status: str = "active",
        affected_services: list[str] | None = None,
        probable_cause: str = "Abnormal ingress traffic burst and rate-limit threshold breach",
        impact_summary: str = "Elevated latency and threat level on ingress gateway",
        recommended_action: str = "Enforce rate limiting and scale backend pods",
    ) -> Dict[str, Any]:
        incident = {
            "id": incident_id,
            "title": title,
            "severity": severity,
            "status": status,  # active, investigating, mitigating, resolved
            "affected_services": affected_services or ["api-gateway", "order-service"],
            "started_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            "resolved_at": None,
            "probable_cause": probable_cause,
            "impact_summary": impact_summary,
            "recommended_action": recommended_action,
        }
        # Deduplicate by id
        self.incidents = [inc for inc in self.incidents if inc["id"] != incident_id]
        self.incidents.insert(0, incident)
        return incident

    def resolve_incident(self, incident_id: str, resolution_notes: str | None = None) -> bool:
        for inc in self.incidents:
            if inc["id"] == incident_id:
                inc["status"] = "resolved"
                inc["resolved_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
                if resolution_notes:
                    inc["resolution_notes"] = resolution_notes
                return True
        return False

    def get_rca(self, incident_id: str) -> Dict[str, Any] | None:
        for inc in self.incidents:
            if inc["id"] == incident_id:
                return {
                    "incident_id": incident_id,
                    "title": inc.get("title"),
                    "severity": inc.get("severity"),
                    "status": inc.get("status"),
                    "root_cause": inc.get("probable_cause"),
                    "evidence": [
                        "Ingress request rate spiked over 400% in a 3-second window.",
                        "Abnormal burst distribution concentrated on /api/simulator/test-target.",
                        "Host CPU crossed warning threshold (70%).",
                    ],
                    "corrective_actions_taken": [
                        "Rate-limiting shield enforced (20 req/s cap).",
                        "Horizontal Pod Autoscaler scaled replicas 2 -> 4 pods.",
                        "Threat subsided and HTTP error rate restored to 0.0%.",
                    ],
                    "preventive_recommendations": (
                        "Keep active ingress rate limiting enabled and maintain horizontal autoscaling policies."
                    ),
                }
        return None

    def clear(self) -> None:
        self.incidents.clear()


incident_service = IncidentService()
