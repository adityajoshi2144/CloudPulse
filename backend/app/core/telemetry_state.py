import time
from typing import Any

from app.core.metrics_collector import metrics_collector


_SERVICE_CATALOG = {
    "api-gateway": ("API Gateway", "gateway", ["auth-service", "order-service", "inventory-service"]),
    "auth-service": ("Auth & Session Service", "core", ["redis-cache", "postgres-db"]),
    "order-service": ("Order Processing Core", "core", ["inventory-service", "payment-service", "postgres-db", "redis-cache"]),
    "inventory-service": ("Catalog & Inventory API", "core", ["redis-cache", "postgres-db"]),
    "payment-service": ("Payment Gateway Adapter", "core", ["postgres-db"]),
    "postgres-db": ("PostgreSQL", "data", []),
    "redis-cache": ("Redis", "cache", []),
}


class TelemetryState:
    """Local demonstration topology plus measurements collected from this process."""

    def __init__(self) -> None:
        self.start_time = time.time()
        self.services: dict[str, dict[str, Any]] = {
            service_id: {
                "id": service_id,
                "name": name,
                "tier": tier,
                "status": "unknown",
                "replicas": None,
                "min_replicas": 1 if tier in ("data", "cache") else 2,
                "max_replicas": 1 if tier in ("data", "cache") else 10,
                "target_cpu": 70,
                "cpu_percent": None,
                "memory_percent": None,
                "rps": None,
                "latency_p95": None,
                "error_rate": None,
                "restart_count": None,
                "dependencies": dependencies,
                "version": "unknown",
                "metrics_source": "not_instrumented",
                "execution_mode": "local_simulation",
            }
            for service_id, (name, tier, dependencies) in _SERVICE_CATALOG.items()
        }
        self.pods: dict[str, list[dict[str, Any]]] = {
            service_id: [] for service_id in self.services
        }
        self.history_1m: list[dict[str, Any]] = []
        self.simulator_active = False
        self.simulator_pattern = "idle"
        self.simulator_vusers = 0
        self.simulator_progress = 0.0
        self.simulator_elapsed = 0
        self.simulator_duration = 60
        self.simulator_is_paused = False
        self.failed_pod_id: str | None = None
        self.failing_service_id: str | None = None
        self.last_scale_time: dict[str, float] = {}

    def get_system_overview(self) -> dict[str, Any]:
        overview = metrics_collector.snapshot()
        elapsed = max(0, int(time.time() - self.start_time))
        overview.update({
            "uptime_seconds": elapsed,
            "uptime": f"{elapsed // 86400}d {(elapsed % 86400) // 3600}h {(elapsed % 3600) // 60}m",
            "uptime_percent": None,
            "total_services": None,
            "healthy_services": None,
            "degraded_services": None,
            "critical_services": None,
            "registered_components": len(self.services),
            "simulated_replicas": sum(len(pods) for pods in self.pods.values()),
        })
        return overview

    def update_tick(self) -> None:
        self.history_1m.append(metrics_collector.sample())
        if len(self.history_1m) > 3600:
            self.history_1m.pop(0)


telemetry_state = TelemetryState()
