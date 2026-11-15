from __future__ import annotations

import math
import time
from collections import deque
from datetime import datetime, timezone
from typing import Any

import psutil


class MetricsCollector:
    def __init__(self) -> None:
        self.started_at = time.time()
        self.process = psutil.Process()
        self.process.cpu_percent(interval=None)
        psutil.cpu_percent(interval=None)
        self.samples: deque[dict[str, Any]] = deque(maxlen=20000)
        self.history: deque[dict[str, Any]] = deque(maxlen=3600)
        self.total_requests = 0
        self.total_duration_seconds = 0.0
        self.database_response_time_ms: float | None = None

    def record_request(self, duration_seconds: float, status_code: int) -> None:
        duration = max(0.0, duration_seconds)
        now = time.time()
        self.samples.append({
            "timestamp_unix": now,
            "duration_seconds": duration,
            "status_code": status_code,
        })
        self.total_requests += 1
        self.total_duration_seconds += duration

    def record_database_probe(self, duration_ms: float) -> None:
        self.database_response_time_ms = max(0.0, duration_ms)

    @staticmethod
    def _percentile(values: list[float], percentile: float) -> float | None:
        if not values:
            return None
        ordered = sorted(values)
        index = max(0, math.ceil(percentile * len(ordered)) - 1)
        return round(ordered[index], 2)

    def snapshot(self) -> dict[str, Any]:
        now = time.time()
        recent = [sample for sample in self.samples if sample["timestamp_unix"] >= now - 60]
        one_second = [sample for sample in recent if sample["timestamp_unix"] >= now - 1]
        latency_window = [
            sample["duration_seconds"] * 1000
            for sample in self.samples
            if sample["timestamp_unix"] >= now - 300
        ]
        errors = sum(1 for sample in recent if sample["status_code"] >= 400)
        cpu_percent = psutil.cpu_percent(interval=None)
        process_cpu_percent = min(
            100.0,
            self.process.cpu_percent(interval=None) / max(1, psutil.cpu_count() or 1),
        )
        memory_percent = psutil.virtual_memory().percent
        latency_avg = (
            round(sum(latency_window) / len(latency_window), 2)
            if latency_window
            else None
        )
        error_rate = round(errors * 100 / len(recent), 2) if recent else None
        last_request = self.samples[-1]["timestamp_unix"] if self.samples else None
        if not recent:
            status = "unknown"
        elif (
            (error_rate is not None and error_rate >= 5)
            or cpu_percent >= 90
            or memory_percent >= 95
            or (self._percentile(latency_window, 0.95) or 0) >= 1000
        ):
            status = "critical"
        elif (
            (error_rate is not None and error_rate >= 2)
            or cpu_percent >= 80
            or memory_percent >= 85
            or (self._percentile(latency_window, 0.95) or 0) >= 500
        ):
            status = "degraded"
        else:
            status = "healthy"

        rps = round(len(one_second), 2)
        p95 = self._percentile(latency_window, 0.95)
        p99 = self._percentile(latency_window, 0.99)
        cpu = round(cpu_percent, 1)
        memory = round(memory_percent, 1)
        return {
            "timestamp": datetime.fromtimestamp(now, timezone.utc).isoformat(),
            "status": status,
            "total_requests": self.total_requests,
            "requests_per_second": rps,
            "total_rps": rps,
            "rps": rps,
            "requests_per_minute": len(recent),
            "avg_latency_ms": latency_avg,
            "latency_avg": latency_avg,
            "p95_latency_ms": p95,
            "latency_p95": p95,
            "p99_latency_ms": p99,
            "error_rate_percent": error_rate,
            "error_rate": error_rate,
            "cpu_utilization_percent": cpu,
            "cpu_percent": cpu,
            "process_cpu_percent": round(process_cpu_percent, 1),
            "memory_utilization_percent": memory,
            "memory_percent": memory,
            "process_memory_percent": round(self.process.memory_percent(), 2),
            "database_response_time_ms": self.database_response_time_ms,
            "queue_depth": None,
            "active_containers": None,
            "active_replicas": None,
            "cache_hit_ratio_percent": None,
            "cache_hit_ratio": None,
            "last_request_timestamp": (
                datetime.fromtimestamp(last_request, timezone.utc).isoformat()
                if last_request is not None
                else None
            ),
            "requests_in_window": len(recent),
            "errors_in_window": errors,
            "metrics_source": "CloudPulse HTTP middleware and host psutil",
            "metrics_scope": "This CloudPulse host only; Kubernetes and external services are not measured.",
        }

    def sample(self) -> dict[str, Any]:
        point = self.snapshot()
        self.history.append(point)
        return point

    def get_history(self, window_seconds: int) -> list[dict[str, Any]]:
        cutoff = time.time() - window_seconds
        return [
            point for point in self.history
            if datetime.fromisoformat(point["timestamp"]).timestamp() >= cutoff
        ]


metrics_collector = MetricsCollector()
