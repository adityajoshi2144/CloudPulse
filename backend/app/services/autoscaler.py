from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.core.telemetry_state import telemetry_state


class AutoScalerService:
    """
    CloudPulse Horizontal Pod Autoscaler (HPA) Engine.
    
    Demonstrates autonomous replica scaling based on CPU, RPS, and latency pressure.
    Clearly identifies simulated Kubernetes scaling vs production cluster orchestration.
    """

    def __init__(self) -> None:
        self.scaling_events: List[Dict[str, Any]] = []
        self._last_scale_time: float = 0.0
        self.current_replicas: dict[str, int] = {
            "api-gateway": 2,
            "order-service": 2,
            "inventory-service": 2,
            "auth-service": 2,
            "payment-service": 2,
        }

    def get_scaling_events(self) -> List[Dict[str, Any]]:
        return list(self.scaling_events)

    def trigger_scaling(
        self,
        service_id: str,
        to_replicas: int,
        trigger_metric: str = "Host CPU / Ingress RPS",
        metric_value: float = 85.0,
        reason: str = "Traffic surge detected; scaled out pods to absorb load.",
        is_real_k8s: bool = False,
    ) -> Dict[str, Any]:
        """Trigger an autonomous or simulated horizontal scaling event."""
        from_replicas = self.current_replicas.get(service_id, 2)
        self.current_replicas[service_id] = to_replicas
        
        if service_id in telemetry_state.services:
            telemetry_state.services[service_id]["replicas"] = to_replicas

        event = {
            "id": len(self.scaling_events) + 1,
            "service_id": service_id,
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            "from_replicas": from_replicas,
            "to_replicas": to_replicas,
            "trigger_metric": trigger_metric,
            "metric_value": metric_value,
            "reason": reason,
            "is_real_k8s": is_real_k8s,
            "execution_mode": "simulated_hpa_engine",
        }
        self.scaling_events.insert(0, event)
        self._last_scale_time = time.time()
        return event

    def scale_down_to_baseline(self, service_id: str = "order-service") -> Dict[str, Any] | None:
        """Scale back down to 2 replicas after load subsides."""
        from_replicas = self.current_replicas.get(service_id, 2)
        if from_replicas <= 2:
            return None
        
        return self.trigger_scaling(
            service_id=service_id,
            to_replicas=2,
            trigger_metric="Host CPU / Ingress RPS",
            metric_value=25.0,
            reason="Traffic returned to baseline; scaled in redundant pods to conserve resources.",
            is_real_k8s=False,
        )

    def reset(self) -> None:
        """Reset replicas back to baseline (2) and clear demo scaling events."""
        for s_id in self.current_replicas:
            self.current_replicas[s_id] = 2
            if s_id in telemetry_state.services:
                telemetry_state.services[s_id]["replicas"] = 2
        self.scaling_events.clear()


autoscaler_service = AutoScalerService()
