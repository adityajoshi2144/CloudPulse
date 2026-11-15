from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

import httpx
from starlette.types import ASGIApp

from app.core.metrics_collector import metrics_collector
from app.core.telemetry_state import telemetry_state
from app.models.entities import SimulatorConfig
from app.services.report_service import report_service
from app.services.risk_engine import risk_engine

logger = logging.getLogger(__name__)


class SimulatorEngine:
    MAX_CONCURRENCY = 10
    MAX_REQUESTS_PER_RUN = 1000
    MAX_REQUESTS_PER_SECOND = 20
    TEST_ENDPOINT = "/api/simulator/test-target"

    def __init__(self) -> None:
        self.is_running = False
        self.is_paused = False
        self.config = SimulatorConfig()
        self.start_timestamp = 0.0
        self.elapsed_seconds = 0
        self.timeline_data: list[dict[str, Any]] = []
        self.requests_sent = 0
        self.errors_seen = 0
        self.scenario_status = "idle"
        self.failure_reason: str | None = None
        self.report_id: str | None = None
        self._report_recorded = True
        self._metrics_before: dict[str, Any] | None = None
        self._risk_before: dict[str, Any] | None = None
        self.test_service_failed = False
        self._app: ASGIApp | None = None
        self._task: asyncio.Task[None] | None = None
        self._resume_event: asyncio.Event | None = None
        self._stop_requested = False

    def configure_local_app(self, app: ASGIApp) -> None:
        self._app = app

    def start(self, config: SimulatorConfig) -> dict[str, Any]:
        if self.is_running:
            raise ValueError("A local simulation is already running.")
        if self._app is None:
            raise RuntimeError("The isolated local test service is not configured.")
        if config.virtual_users > self.MAX_CONCURRENCY:
            raise ValueError(f"Concurrency is limited to {self.MAX_CONCURRENCY}.")
        if config.max_requests > self.MAX_REQUESTS_PER_RUN:
            raise ValueError(f"Requests per run are limited to {self.MAX_REQUESTS_PER_RUN}.")

        metrics_before = metrics_collector.snapshot()
        risk_before = risk_engine.calculate()
        self.config = config
        self.failure_reason = None
        self.report_id = None
        self._report_recorded = False
        self._metrics_before = metrics_before
        self._risk_before = risk_before
        self.is_running = True
        self.is_paused = False
        self.start_timestamp = time.time()
        self.elapsed_seconds = 0
        self.requests_sent = 0
        self.errors_seen = 0
        self.timeline_data.clear()
        self._stop_requested = False
        self._resume_event = asyncio.Event()
        self._resume_event.set()
        self.test_service_failed = config.pattern == "failure"
        self.scenario_status = "running"

        telemetry_state.simulator_active = True
        telemetry_state.simulator_pattern = config.pattern
        telemetry_state.simulator_vusers = config.virtual_users
        telemetry_state.simulator_duration = config.duration_seconds
        telemetry_state.simulator_elapsed = 0
        telemetry_state.simulator_progress = 0.0
        telemetry_state.simulator_is_paused = False

        self._task = asyncio.create_task(self._run())
        return self.get_status()

    def pause(self) -> dict[str, Any]:
        if self.is_running and not self.is_paused:
            self.is_paused = True
            if self._resume_event:
                self._resume_event.clear()
            telemetry_state.simulator_is_paused = True
            self.scenario_status = "paused"
        return self.get_status()

    def resume(self) -> dict[str, Any]:
        if self.is_running and self.is_paused:
            self.is_paused = False
            if self._resume_event:
                self._resume_event.set()
            telemetry_state.simulator_is_paused = False
            self.scenario_status = "running"
        return self.get_status()

    async def stop(self) -> dict[str, Any]:
        if not self.is_running:
            return self.get_status()
        self._stop_requested = True
        task = self._task
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        return self.get_status()

    async def _run(self) -> None:
        if self._app is None:
            self._finish("failed")
            return

        try:
            transport = httpx.ASGITransport(app=self._app, client=("127.0.0.1", 0))
            async with httpx.AsyncClient(
                transport=transport,
                base_url="http://127.0.0.1",
                timeout=2.0,
            ) as client:
                started = time.monotonic()
                finish_status = "completed"
                for second in range(self.config.duration_seconds):
                    await self._wait_until_resumed()
                    if self._stop_requested:
                        break

                    self.elapsed_seconds = second + 1
                    telemetry_state.simulator_elapsed = self.elapsed_seconds
                    telemetry_state.simulator_progress = round(
                        self.elapsed_seconds * 100 / self.config.duration_seconds,
                        1,
                    )

                    if self.config.pattern == "resource":
                        await asyncio.to_thread(self._bounded_cpu_work)

                    request_count = self._requests_for_second(second)
                    remaining = self.config.max_requests - self.requests_sent
                    await self._send_requests(client, min(request_count, remaining))
                    self._record_timeline_point()

                    if self.requests_sent >= self.config.max_requests:
                        finish_status = "request_limit_reached"
                        break

                    remaining_second = 1.0 - (time.monotonic() - started - second)
                    if remaining_second > 0:
                        await asyncio.sleep(remaining_second)
            self._finish("stopped" if self._stop_requested else finish_status)
        except asyncio.CancelledError:
            self._finish("stopped")
            raise
        except Exception as exc:
            self.failure_reason = str(exc)
            logger.exception("Local traffic simulation failed")
            self._finish("failed")

    async def _wait_until_resumed(self) -> None:
        while self.is_paused and not self._stop_requested:
            if self._resume_event is None:
                return
            await self._resume_event.wait()

    async def _send_requests(self, client: httpx.AsyncClient, request_count: int) -> None:
        for offset in range(0, request_count, self.config.virtual_users):
            batch_size = min(self.config.virtual_users, request_count - offset)
            self.requests_sent += batch_size
            results = await asyncio.gather(
                *(
                    client.get(self.TEST_ENDPOINT)
                    for _ in range(batch_size)
                ),
                return_exceptions=True,
            )
            self.errors_seen += sum(
                1
                for result in results
                if isinstance(result, Exception)
                or (isinstance(result, httpx.Response) and result.status_code >= 400)
            )

    def _requests_for_second(self, second: int) -> int:
        intensity_rate = {
            "low": 2,
            "medium": 8,
            "high": self.MAX_REQUESTS_PER_SECOND,
        }[self.config.intensity]
        pattern = self.config.pattern

        if pattern == "normal":
            return min(2, intensity_rate)
        if pattern == "spike":
            return 1 if second < 3 else intensity_rate
        if pattern == "flood":
            return intensity_rate
        if pattern == "burst":
            return intensity_rate if second % 4 == 0 else 0
        if pattern == "gradual":
            if self.config.ramp_up_seconds == 0:
                return intensity_rate
            progress = min(1.0, (second + 1) / self.config.ramp_up_seconds)
            return max(1, round(intensity_rate * progress))
        if pattern in {"resource", "failure"}:
            return 1
        return 0

    @staticmethod
    def _bounded_cpu_work() -> None:
        deadline = time.perf_counter() + 0.05
        value = 0
        while time.perf_counter() < deadline:
            value = (value * 33 + 17) % 1000003

    def _record_timeline_point(self) -> None:
        snapshot = metrics_collector.snapshot()
        self.timeline_data.append({
            "second": self.elapsed_seconds,
            "timestamp": snapshot["timestamp"],
            "rps": snapshot["requests_per_second"],
            "latency_p95": snapshot["p95_latency_ms"],
            "error_rate": snapshot["error_rate_percent"],
            "cpu_percent": snapshot["cpu_utilization_percent"],
            "memory_percent": snapshot["memory_utilization_percent"],
            "active_replicas": snapshot["active_replicas"],
            "virtual_users": self.config.virtual_users,
        })
        if len(self.timeline_data) > 60:
            self.timeline_data.pop(0)

    def _finish(self, status: str) -> None:
        self.is_running = False
        self.is_paused = False
        self.test_service_failed = False
        endpoint_recovered = not self.test_service_failed
        self.scenario_status = status
        telemetry_state.simulator_active = False
        telemetry_state.simulator_pattern = "idle"
        telemetry_state.simulator_vusers = 0
        telemetry_state.simulator_elapsed = self.elapsed_seconds
        telemetry_state.simulator_progress = (
            100.0 if status == "completed" else telemetry_state.simulator_progress
        )
        telemetry_state.simulator_is_paused = False
        if self._report_recorded or self._metrics_before is None or self._risk_before is None:
            return
        self._report_recorded = True
        try:
            report = report_service.record_simulation(
                config=self.config,
                status=status,
                requests_sent=self.requests_sent,
                errors_seen=self.errors_seen,
                elapsed_seconds=self.elapsed_seconds,
                timeline=self.timeline_data,
                metrics_before=self._metrics_before,
                metrics_after=metrics_collector.snapshot(),
                risk_before=self._risk_before,
                risk_after=risk_engine.calculate(),
                test_endpoint_available=endpoint_recovered,
            )
            self.report_id = report["id"]
        except Exception as exc:
            self.failure_reason = f"Simulation ended, but its report could not be created: {exc}"
            self.scenario_status = "report_failed"
            logger.exception("Failed to create a simulation report")

    def get_status(self) -> dict[str, Any]:
        return {
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "pattern": self.config.pattern,
            "virtual_users": self.config.virtual_users,
            "intensity": self.config.intensity,
            "duration_seconds": self.config.duration_seconds,
            "elapsed_seconds": self.elapsed_seconds,
            "progress_percent": round(
                min(100.0, self.elapsed_seconds * 100 / self.config.duration_seconds),
                1,
            ),
            "target_service": self.config.target_service,
            "safe_simulation_mode": True,
            "safety_scope": "In-process HTTP requests to CloudPulse's local test endpoint only.",
            "scenario_status": self.scenario_status,
            "requests_sent": self.requests_sent,
            "request_cap": self.config.max_requests,
            "errors_seen": self.errors_seen,
            "failure_reason": self.failure_reason,
            "report_id": self.report_id,
            "live_timeline": self.timeline_data[-60:],
        }


simulator_engine = SimulatorEngine()
