import asyncio
import time
import random
import math
from datetime import datetime
from typing import Dict, List, Any, Optional

class TelemetryState:
    """
    Central real-time telemetry state engine for CloudPulse.
    Maintains live metrics, services, pod instances, time-series history buffers,
    and handles WebSocket broadcasts.
    """
    def __init__(self):
        self.start_time = time.time()
        self.subscribers: List[asyncio.Queue] = []
        
        # Microservice Registry
        self.services: Dict[str, Dict[str, Any]] = {
            "api-gateway": {
                "id": "api-gateway",
                "name": "API Gateway (NGINX/Kong)",
                "tier": "gateway",
                "status": "healthy",
                "replicas": 3,
                "min_replicas": 2,
                "max_replicas": 8,
                "target_cpu": 70,
                "cpu_percent": 34.2,
                "memory_percent": 42.1,
                "rps": 340.5,
                "latency_p95": 14.8,
                "error_rate": 0.01,
                "restart_count": 0,
                "dependencies": ["auth-service", "order-service", "inventory-service"],
                "version": "v1.25.4"
            },
            "auth-service": {
                "id": "auth-service",
                "name": "Auth & Session Service",
                "tier": "core",
                "status": "healthy",
                "replicas": 2,
                "min_replicas": 2,
                "max_replicas": 6,
                "target_cpu": 70,
                "cpu_percent": 28.6,
                "memory_percent": 38.4,
                "rps": 120.0,
                "latency_p95": 22.4,
                "error_rate": 0.00,
                "restart_count": 1,
                "dependencies": ["redis-cache", "postgres-db"],
                "version": "v2.3.0"
            },
            "order-service": {
                "id": "order-service",
                "name": "Order Processing Core",
                "tier": "core",
                "status": "healthy",
                "replicas": 3,
                "min_replicas": 2,
                "max_replicas": 12,
                "target_cpu": 70,
                "cpu_percent": 48.2,
                "memory_percent": 56.8,
                "rps": 185.2,
                "latency_p95": 42.1,
                "error_rate": 0.04,
                "restart_count": 0,
                "dependencies": ["inventory-service", "payment-service", "postgres-db", "redis-cache"],
                "version": "v3.1.2"
            },
            "inventory-service": {
                "id": "inventory-service",
                "name": "Catalog & Inventory API",
                "tier": "core",
                "status": "healthy",
                "replicas": 2,
                "min_replicas": 2,
                "max_replicas": 8,
                "target_cpu": 70,
                "cpu_percent": 38.0,
                "memory_percent": 49.3,
                "rps": 210.4,
                "latency_p95": 18.5,
                "error_rate": 0.01,
                "restart_count": 0,
                "dependencies": ["redis-cache", "postgres-db"],
                "version": "v2.8.0"
            },
            "payment-service": {
                "id": "payment-service",
                "name": "Payment Gateway Adapter",
                "tier": "core",
                "status": "healthy",
                "replicas": 2,
                "min_replicas": 2,
                "max_replicas": 6,
                "target_cpu": 65,
                "cpu_percent": 31.4,
                "memory_percent": 44.0,
                "rps": 65.8,
                "latency_p95": 68.2,
                "error_rate": 0.02,
                "restart_count": 0,
                "dependencies": ["postgres-db"],
                "version": "v1.9.4"
            },
            "postgres-db": {
                "id": "postgres-db",
                "name": "PostgreSQL 16 Primary",
                "tier": "data",
                "status": "healthy",
                "replicas": 1,
                "min_replicas": 1,
                "max_replicas": 1,
                "target_cpu": 80,
                "cpu_percent": 24.5,
                "memory_percent": 62.0,
                "rps": 580.0,
                "latency_p95": 8.4,
                "error_rate": 0.00,
                "restart_count": 0,
                "dependencies": [],
                "version": "16.2-alpine"
            },
            "redis-cache": {
                "id": "redis-cache",
                "name": "Redis Distributed Cache",
                "tier": "cache",
                "status": "healthy",
                "replicas": 1,
                "min_replicas": 1,
                "max_replicas": 1,
                "target_cpu": 80,
                "cpu_percent": 18.2,
                "memory_percent": 31.5,
                "rps": 920.0,
                "latency_p95": 1.2,
                "error_rate": 0.00,
                "restart_count": 0,
                "dependencies": [],
                "version": "7.2.4-alpine"
            }
        }

        # Pod instance tracker
        self.pods: Dict[str, List[Dict[str, Any]]] = {}
        self._initialize_pods()

        # Telemetry Time-Series Buffer (60 points for 1m live window)
        self.history_1m: List[Dict[str, Any]] = []
        self._seed_history()

        # Simulator State
        self.simulator_active: bool = False
        self.simulator_pattern: str = "idle" # normal, spike, sustained, gradual, reduction
        self.simulator_vusers: int = 0
        self.simulator_progress: float = 0.0
        self.simulator_elapsed: int = 0
        self.simulator_duration: int = 60
        self.simulator_is_paused: bool = False

        # Injected chaos / failure scenarios
        self.failed_pod_id: Optional[str] = None
        self.failing_service_id: Optional[str] = None
        
        # Scaling cooldown trackers: service_id -> last_scale_timestamp
        self.last_scale_time: Dict[str, float] = {}

    def _initialize_pods(self):
        nodes = ["k8s-node-worker-01", "k8s-node-worker-02", "k8s-node-worker-03"]
        for s_id, s_data in self.services.items():
            if s_id in ["postgres-db", "redis-cache"]:
                self.pods[s_id] = [{
                    "id": f"{s_id}-0",
                    "service_id": s_id,
                    "status": "Running",
                    "ready": True,
                    "node": "k8s-node-infra-01",
                    "ip": f"10.244.0.{random.randint(10, 80)}",
                    "cpu_percent": s_data["cpu_percent"],
                    "memory_percent": s_data["memory_percent"],
                    "restarts": s_data["restart_count"],
                    "uptime_seconds": 348200
                }]
            else:
                self.pods[s_id] = []
                for i in range(s_data["replicas"]):
                    self.pods[s_id].append({
                        "id": f"{s_id}-{hash(f'{s_id}-{i}') % 900000 + 100000}",
                        "service_id": s_id,
                        "status": "Running",
                        "ready": True,
                        "node": random.choice(nodes),
                        "ip": f"10.244.1.{random.randint(10, 200)}",
                        "cpu_percent": round(s_data["cpu_percent"] + random.uniform(-4, 4), 1),
                        "memory_percent": round(s_data["memory_percent"] + random.uniform(-3, 3), 1),
                        "restarts": 0 if i > 0 else s_data["restart_count"],
                        "uptime_seconds": random.randint(14000, 180000)
                    })

    def _seed_history(self):
        now = time.time()
        for i in range(60, 0, -1):
            ts = now - i
            t_str = datetime.fromtimestamp(ts).strftime("%H:%M:%S")
            self.history_1m.append({
                "timestamp": t_str,
                "rps": round(920 + math.sin(i * 0.2) * 50 + random.uniform(-20, 20), 1),
                "latency_p95": round(32.5 + math.cos(i * 0.15) * 4 + random.uniform(-2, 2), 1),
                "latency_avg": round(18.2 + math.cos(i * 0.15) * 2 + random.uniform(-1, 1), 1),
                "error_rate": round(max(0.01, 0.03 + random.uniform(-0.01, 0.02)), 2),
                "cpu_percent": round(38.4 + math.sin(i * 0.1) * 3 + random.uniform(-1, 2), 1),
                "memory_percent": round(48.2 + random.uniform(-0.5, 0.5), 1),
                "active_replicas": 14,
                "cache_hit_ratio": round(88.4 + random.uniform(-0.8, 0.8), 1)
            })

    def get_system_overview(self) -> Dict[str, Any]:
        """Aggregate total cluster metrics."""
        total_replicas = sum(len(pod_list) for pod_list in self.pods.values())
        app_services = [s for k, s in self.services.items() if k not in ["postgres-db", "redis-cache"]]
        
        avg_cpu = round(sum(s["cpu_percent"] for s in app_services) / len(app_services), 1)
        avg_mem = round(sum(s["memory_percent"] for s in app_services) / len(app_services), 1)
        total_rps = round(sum(s["rps"] for s in self.services.values()), 1)
        p95_latency = max(s["latency_p95"] for s in app_services)
        avg_latency = round(sum(s["latency_p95"] for s in app_services) / len(app_services) * 0.55, 1)
        cluster_error_rate = round(sum(s["error_rate"] for s in app_services) / len(app_services), 2)
        
        # Calculate cluster status
        has_critical = any(s["status"] == "critical" for s in self.services.values())
        has_degraded = any(s["status"] == "degraded" for s in self.services.values())
        system_status = "critical" if has_critical else ("degraded" if has_degraded else "healthy")

        uptime_seconds = int(time.time() - self.start_time) + 432000 # 5 days + session
        uptime_str = f"{uptime_seconds // 86400}d {(uptime_seconds % 86400) // 3600}h {((uptime_seconds % 3600) // 60)}m"

        return {
            "status": system_status,
            "total_rps": total_rps,
            "avg_latency_ms": avg_latency,
            "p95_latency_ms": p95_latency,
            "error_rate_percent": cluster_error_rate,
            "cpu_utilization_percent": avg_cpu,
            "memory_utilization_percent": avg_mem,
            "active_replicas": total_replicas,
            "cache_hit_ratio_percent": 88.6,
            "uptime": uptime_str,
            "uptime_percent": 99.98,
            "total_services": len(self.services),
            "healthy_services": sum(1 for s in self.services.values() if s["status"] == "healthy"),
            "degraded_services": sum(1 for s in self.services.values() if s["status"] == "degraded"),
            "critical_services": sum(1 for s in self.services.values() if s["status"] == "critical")
        }

    def update_tick(self):
        """Called every second by background worker to evolve metrics."""
        now_ts = datetime.utcnow().strftime("%H:%M:%S")
        
        # Simulator progression
        sim_load_multiplier = 1.0
        if self.simulator_active and not self.simulator_is_paused:
            self.simulator_elapsed += 1
            progress = min(1.0, self.simulator_elapsed / max(1, self.simulator_duration))
            self.simulator_progress = round(progress * 100, 1)
            
            if self.simulator_pattern == "spike":
                # Rapid spike in middle
                if progress < 0.2:
                    sim_load_multiplier = 1.0 + (progress / 0.2) * 2.5
                elif progress < 0.7:
                    sim_load_multiplier = 3.5 + random.uniform(-0.3, 0.4)
                else:
                    sim_load_multiplier = 3.5 - ((progress - 0.7) / 0.3) * 2.5
            elif self.simulator_pattern == "sustained":
                sim_load_multiplier = 2.8 + random.uniform(-0.2, 0.2)
            elif self.simulator_pattern == "gradual":
                sim_load_multiplier = 1.0 + progress * 2.2
            elif self.simulator_pattern == "reduction":
                sim_load_multiplier = max(0.2, 1.0 - progress * 0.8)
            else: # normal
                sim_load_multiplier = 1.2 + random.uniform(-0.1, 0.1)

            if self.simulator_elapsed >= self.simulator_duration:
                self.simulator_active = False
                self.simulator_pattern = "idle"
                self.simulator_progress = 100.0

        # Evolve microservice metrics based on load multiplier & chaos
        for s_id, s_data in self.services.items():
            if s_id in ["postgres-db", "redis-cache"]:
                continue
            
            # Base load variation
            jitter = random.uniform(-1.5, 1.5)
            s_data["rps"] = round(max(10.0, s_data.get("base_rps", 150) * sim_load_multiplier + jitter * 8), 1)
            
            # CPU depends on RPS divided by replica count
            replicas = max(1, len(self.pods.get(s_id, [])))
            rps_per_pod = s_data["rps"] / replicas
            target_calc_cpu = min(98.5, max(12.0, (rps_per_pod / 60.0) * 45.0 + jitter * 2))
            
            # If chaotic failure injected
            if self.failing_service_id == s_id:
                s_data["cpu_percent"] = 96.8
                s_data["error_rate"] = 18.5
                s_data["latency_p95"] = 385.0
                s_data["status"] = "critical"
            else:
                # Normal smoothing
                s_data["cpu_percent"] = round(s_data["cpu_percent"] * 0.8 + target_calc_cpu * 0.2, 1)
                s_data["memory_percent"] = round(min(90.0, 40.0 + (s_data["cpu_percent"] * 0.35) + random.uniform(-0.5, 0.5)), 1)
                s_data["latency_p95"] = round(max(8.0, 18.0 + (s_data["cpu_percent"] * 0.4) + random.uniform(-1.0, 1.0)), 1)
                s_data["error_rate"] = round(max(0.0, (s_data["cpu_percent"] - 85.0) * 0.1) if s_data["cpu_percent"] > 85.0 else 0.01, 2)
                
                # Status based on CPU & errors
                if s_data["error_rate"] > 5.0 or s_data["cpu_percent"] > 90.0:
                    s_data["status"] = "critical"
                elif s_data["error_rate"] > 1.0 or s_data["cpu_percent"] > 78.0:
                    s_data["status"] = "degraded"
                else:
                    s_data["status"] = "healthy"

            # Sync pod replica list CPU
            for pod in self.pods.get(s_id, []):
                if pod["id"] == self.failed_pod_id:
                    pod["status"] = "CrashLoopBackOff"
                    pod["ready"] = False
                    pod["cpu_percent"] = 99.4
                else:
                    pod["status"] = "Running"
                    pod["ready"] = True
                    pod["cpu_percent"] = round(max(5.0, s_data["cpu_percent"] + random.uniform(-3, 3)), 1)
                    pod["memory_percent"] = round(max(10.0, s_data["memory_percent"] + random.uniform(-2, 2)), 1)

        # Snapshot overview
        overview = self.get_system_overview()
        
        # Append to 1m history
        self.history_1m.append({
            "timestamp": now_ts,
            "rps": overview["total_rps"],
            "latency_p95": overview["p95_latency_ms"],
            "latency_avg": overview["avg_latency_ms"],
            "error_rate": overview["error_rate_percent"],
            "cpu_percent": overview["cpu_utilization_percent"],
            "memory_percent": overview["memory_utilization_percent"],
            "active_replicas": overview["active_replicas"],
            "cache_hit_ratio": overview["cache_hit_ratio_percent"]
        })
        if len(self.history_1m) > 120:
            self.history_1m.pop(0)

telemetry_state = TelemetryState()
