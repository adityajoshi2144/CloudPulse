
from __future__ import annotations

from typing import Any

from app.models.entities import SimulatorConfig
from app.services.report_service import report_service
from app.services.simulator_engine import simulator_engine


class ExperimentRunner:
    def __init__(self) -> None:
        self.experiments: list[dict[str, Any]] = []

    def get_experiments(self) -> list[dict[str, Any]]:
        return list(self.experiments)

    async def run_benchmark(
        self,
        name: str,
        duration: int,
        vusers: int,
        pattern: str,
        intensity: str,
        max_requests: int,
    ) -> dict[str, Any]:
        if simulator_engine.is_running:
            raise ValueError("Stop the active simulation before starting an experiment.")

        config = SimulatorConfig(
            pattern=pattern,
            virtual_users=vusers,
            intensity=intensity,
            duration_seconds=duration,
            ramp_up_seconds=duration,
            max_requests=max_requests,
        )
        simulator_engine.start(config)
        task = simulator_engine._task
        if task is None:
            raise RuntimeError("The local simulation task did not start.")
        await task

        report_id = simulator_engine.report_id
        report = report_service.get_report(report_id) if report_id else None
        if report is None:
            raise RuntimeError("The completed experiment has no simulation report.")

        result = {
            "id": report["id"],
            "name": name,
            "description": (
                "Measured local CloudPulse load run. This result does not compare "
                "or claim fixed, Kubernetes-reactive, or AI-predictive scaling."
            ),
            "created_at": report["created_at"],
            "status": report["status"],
            "scenario": report["scenario"],
            "workload": report["workload"],
            "metrics_before": report["metrics_before"],
            "metrics_after": report["metrics_after"],
            "metric_deltas": report["metric_deltas"],
            "risk_before": report["risk_before"],
            "risk_after": report["risk_after"],
            "metrics_source": "Measured CloudPulse HTTP middleware and host psutil",
            "metrics_scope": report["metrics_scope"],
            "scaling_note": report["scaling_note"],
            "report_id": report["id"],
            "timeline": report["timeline"],
        }
        self.experiments.insert(0, result)
        del self.experiments[50:]
        return result


experiment_runner = ExperimentRunner()
