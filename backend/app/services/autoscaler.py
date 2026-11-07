import time
import math
import random
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.core.telemetry_state import telemetry_state
from app.core.config import settings

logger = logging.getLogger("cloudpulse.autoscaler")

class AutoScalerService:
    def __init__(self):
        self.scaling_events: List[Dict[str, Any]] = [
            {
                "id": 101,
                "service_id": "order-service",
                "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "from_replicas": 2,
                "to_replicas": 3,
                "trigger_metric": "CPU Utilization",
                "metric_value": 78.4,
                "reason": "CPU utilization reached 78.4% (target: 70%). Horizontal Pod Autoscaler triggered scale-up to absorb order processing load.",
                "is_real_k8s": settings.KUBERNETES_ENABLED
            },
            {
                "id": 100,
                "service_id": "api-gateway",
                "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "from_replicas": 2,
                "to_replicas": 3,
                "trigger_metric": "Throughput (RPS)",
                "metric_value": 310.0,
                "reason": "Throughput exceeded threshold (300 RPS). Scaled gateway instances to maintain sub-20ms edge latency.",
                "is_real_k8s": settings.KUBERNETES_ENABLED
            }
        ]

    def evaluate_hpa(self) -> List[Dict[str, Any]]:
        """
        Executes standard Kubernetes Horizontal Pod Autoscaler (HPA v2) algorithm:
        desiredReplicas = ceil[currentReplicas * ( currentMetricValue / targetMetricValue )]
        Respects min/max replica boundaries and scale-up/scale-down cooldown timers.
        """
        now = time.time()
        new_events = []

        for s_id, s_data in telemetry_state.services.items():
            if s_id in ["postgres-db", "redis-cache"]:
                continue

            current_replicas = len(telemetry_state.pods.get(s_id, []))
            target_cpu = s_data.get("target_cpu", 70)
            current_cpu = s_data.get("cpu_percent", 35.0)
            min_reps = s_data.get("min_replicas", 2)
            max_reps = s_data.get("max_replicas", 10)

            last_scaled = telemetry_state.last_scale_time.get(s_id, 0)
            
            # Check if metric deviates significantly from target (outside 10% tolerance band)
            ratio = current_cpu / max(1.0, float(target_cpu))
            if 0.9 <= ratio <= 1.1:
                continue

            calculated_desired = math.ceil(current_replicas * ratio)
            clamped_desired = max(min_reps, min(max_reps, calculated_desired))

            if clamped_desired == current_replicas:
                continue

            # Scale-up evaluation
            if clamped_desired > current_replicas:
                if (now - last_scaled) < settings.SCALE_UP_COOLDOWN_SEC:
                    continue # Cooldown active
                
                # Execute scale-up
                telemetry_state.last_scale_time[s_id] = now
                added_count = clamped_desired - current_replicas
                for i in range(added_count):
                    new_pod = {
                        "id": f"{s_id}-{hash(f'{s_id}-{time.time()}-{i}') % 900000 + 100000}",
                        "service_id": s_id,
                        "status": "Running",
                        "ready": True,
                        "node": random.choice(["k8s-node-worker-01", "k8s-node-worker-02", "k8s-node-worker-03"]),
                        "ip": f"10.244.1.{random.randint(20, 240)}",
                        "cpu_percent": round(current_cpu * 0.7, 1),
                        "memory_percent": round(s_data["memory_percent"], 1),
                        "restarts": 0,
                        "uptime_seconds": 1
                    }
                    telemetry_state.pods[s_id].append(new_pod)
                
                s_data["replicas"] = clamped_desired
                event = {
                    "id": len(self.scaling_events) + 101,
                    "service_id": s_id,
                    "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                    "from_replicas": current_replicas,
                    "to_replicas": clamped_desired,
                    "trigger_metric": "CPU Utilization",
                    "metric_value": current_cpu,
                    "reason": f"Scale-Up triggered: Average CPU ({current_cpu}%) exceeded target ({target_cpu}%). Replicas increased from {current_replicas} to {clamped_desired}.",
                    "is_real_k8s": settings.KUBERNETES_ENABLED
                }
                self.scaling_events.insert(0, event)
                new_events.append(event)
                logger.info("AutoScaler scaled UP %s to %d pods", s_id, clamped_desired)

            # Scale-down evaluation
            elif clamped_desired < current_replicas:
                if (now - last_scaled) < settings.SCALE_DOWN_COOLDOWN_SEC:
                    continue # Stabilization window active
                
                telemetry_state.last_scale_time[s_id] = now
                remove_count = current_replicas - clamped_desired
                for _ in range(remove_count):
                    if telemetry_state.pods[s_id]:
                        telemetry_state.pods[s_id].pop()

                s_data["replicas"] = clamped_desired
                event = {
                    "id": len(self.scaling_events) + 101,
                    "service_id": s_id,
                    "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                    "from_replicas": current_replicas,
                    "to_replicas": clamped_desired,
                    "trigger_metric": "CPU Utilization",
                    "metric_value": current_cpu,
                    "reason": f"Scale-Down stabilization: Average CPU ({current_cpu}%) settled below target ({target_cpu}%). Reduced replicas from {current_replicas} to {clamped_desired}.",
                    "is_real_k8s": settings.KUBERNETES_ENABLED
                }
                self.scaling_events.insert(0, event)
                new_events.append(event)
                logger.info("AutoScaler scaled DOWN %s to %d pods", s_id, clamped_desired)

        return new_events

    def manual_scale(self, service_id: str, replicas: int, operator: str = "admin") -> Dict[str, Any]:
        """Manually overrides replica count for a microservice."""
        if service_id not in telemetry_state.services:
            raise ValueError(f"Service {service_id} not found")
        
        s_data = telemetry_state.services[service_id]
        prev_replicas = len(telemetry_state.pods.get(service_id, []))
        clamped = max(s_data["min_replicas"], min(s_data["max_replicas"], replicas))
        
        telemetry_state.last_scale_time[service_id] = time.time()
        
        # Adjust pods
        current_list = telemetry_state.pods.get(service_id, [])
        if clamped > prev_replicas:
            for i in range(clamped - prev_replicas):
                current_list.append({
                    "id": f"{service_id}-{hash(f'{service_id}-manual-{time.time()}-{i}') % 900000 + 100000}",
                    "service_id": service_id,
                    "status": "Running",
                    "ready": True,
                    "node": random.choice(["k8s-node-worker-01", "k8s-node-worker-02"]),
                    "ip": f"10.244.1.{random.randint(10, 240)}",
                    "cpu_percent": round(s_data["cpu_percent"] * 0.8, 1),
                    "memory_percent": round(s_data["memory_percent"], 1),
                    "restarts": 0,
                    "uptime_seconds": 1
                })
        elif clamped < prev_replicas:
            telemetry_state.pods[service_id] = current_list[:clamped]
            
        s_data["replicas"] = clamped
        event = {
            "id": len(self.scaling_events) + 101,
            "service_id": service_id,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "from_replicas": prev_replicas,
            "to_replicas": clamped,
            "trigger_metric": "Manual Operator Action",
            "metric_value": float(clamped),
            "reason": f"Manual scaling executed by {operator}: Replicas adjusted from {prev_replicas} to {clamped}.",
            "is_real_k8s": settings.KUBERNETES_ENABLED
        }
        self.scaling_events.insert(0, event)
        return event

autoscaler_service = AutoScalerService()
