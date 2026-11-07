import asyncio
import time
import math
import random
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.telemetry_state import telemetry_state
from app.models.entities import SimulatorConfig

logger = logging.getLogger("cloudpulse.simulator")

class SimulatorEngine:
    def __init__(self):
        self.is_running: bool = False
        self.is_paused: bool = False
        self.config: SimulatorConfig = SimulatorConfig()
        self.start_timestamp: float = 0.0
        self.elapsed_seconds: int = 0
        self.timeline_data: List[Dict[str, Any]] = []
        self._task: Optional[asyncio.Task] = None

    def start(self, config: SimulatorConfig) -> Dict[str, Any]:
        self.config = config
        self.is_running = True
        self.is_paused = False
        self.start_timestamp = time.time()
        self.elapsed_seconds = 0
        self.timeline_data.clear()

        # Update telemetry state engine
        telemetry_state.simulator_active = True
        telemetry_state.simulator_pattern = config.pattern
        telemetry_state.simulator_vusers = config.virtual_users
        telemetry_state.simulator_duration = config.duration_seconds
        telemetry_state.simulator_elapsed = 0
        telemetry_state.simulator_is_paused = False

        logger.info("Traffic simulator started: pattern=%s, vusers=%d, duration=%ds",
                    config.pattern, config.virtual_users, config.duration_seconds)

        return self.get_status()

    def pause(self) -> Dict[str, Any]:
        if self.is_running:
            self.is_paused = True
            telemetry_state.simulator_is_paused = True
        return self.get_status()

    def resume(self) -> Dict[str, Any]:
        if self.is_running:
            self.is_paused = False
            telemetry_state.simulator_is_paused = False
        return self.get_status()

    def stop(self) -> Dict[str, Any]:
        self.is_running = False
        self.is_paused = False
        telemetry_state.simulator_active = False
        telemetry_state.simulator_pattern = "idle"
        telemetry_state.simulator_vusers = 0
        telemetry_state.simulator_elapsed = 0
        telemetry_state.simulator_progress = 0.0
        telemetry_state.simulator_is_paused = False
        logger.info("Traffic simulator stopped")
        return self.get_status()

    def tick(self):
        """Called every second when simulator is running."""
        if not self.is_running or self.is_paused:
            return

        self.elapsed_seconds += 1
        progress = min(1.0, self.elapsed_seconds / max(1, self.config.duration_seconds))
        now_str = datetime.utcnow().strftime("%H:%M:%S")

        # Current snapshot from telemetry state
        overview = telemetry_state.get_system_overview()
        
        point = {
            "second": self.elapsed_seconds,
            "timestamp": now_str,
            "rps": overview["total_rps"],
            "latency_p95": overview["p95_latency_ms"],
            "error_rate": overview["error_rate_percent"],
            "cpu_percent": overview["cpu_utilization_percent"],
            "memory_percent": overview["memory_utilization_percent"],
            "active_replicas": overview["active_replicas"],
            "virtual_users": int(self.config.virtual_users * (progress if self.config.pattern == "gradual" else 1.0))
        }
        self.timeline_data.append(point)
        if len(self.timeline_data) > 300:
            self.timeline_data.pop(0)

        if self.elapsed_seconds >= self.config.duration_seconds:
            self.stop()

    def get_status(self) -> Dict[str, Any]:
        progress = round(min(100.0, (self.elapsed_seconds / max(1, self.config.duration_seconds)) * 100), 1) if self.is_running else 0.0
        return {
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "pattern": self.config.pattern,
            "virtual_users": self.config.virtual_users,
            "duration_seconds": self.config.duration_seconds,
            "elapsed_seconds": self.elapsed_seconds,
            "progress_percent": progress,
            "target_service": self.config.target_service,
            "safe_simulation_mode": self.config.safe_simulation_mode,
            "live_timeline": self.timeline_data[-30:] # Return recent 30 seconds for live chart
        }

simulator_engine = SimulatorEngine()
