from __future__ import annotations

from typing import Any

from app.core.metrics_collector import metrics_collector


_DEFAULT_WEIGHTS = {
    "request_rate_anomaly": 1.4,
    "p95_latency": 1.4,
    "http_error_rate": 1.3,
    "cpu_utilization": 1.1,
    "memory_utilization": 1.1,
    "queue_depth": 0.8,
    "pod_health": 1.2,
    "pod_restart_frequency": 0.8,
    "autoscaling_delay": 1.0,
    "traffic_anomaly_score": 1.1,
}
_DEFAULT_THRESHOLDS = {
    "request_rate_anomaly": {"warning": 2.0, "critical": 4.0},
    "p95_latency": {"warning": 500.0, "critical": 1000.0},
    "http_error_rate": {"warning": 2.0, "critical": 5.0},
    "cpu_utilization": {"warning": 70.0, "critical": 100.0},
    "memory_utilization": {"warning": 80.0, "critical": 100.0},
    "queue_depth": {"warning": 20.0, "critical": 100.0},
    "pod_health": {"warning": 95.0, "critical": 80.0},
    "pod_restart_frequency": {"warning": 2.0, "critical": 10.0},
    "autoscaling_delay": {"warning": 15.0, "critical": 60.0},
    "traffic_anomaly_score": {"warning": 0.6, "critical": 0.9},
}
_FACTOR_LABELS = {
    "request_rate_anomaly": "Request rate anomaly",
    "p95_latency": "P95 latency",
    "http_error_rate": "HTTP error rate",
    "cpu_utilization": "Host CPU utilization",
    "memory_utilization": "Host memory utilization",
    "queue_depth": "Queue depth",
    "pod_health": "Pod health",
    "pod_restart_frequency": "Pod restart frequency",
    "autoscaling_delay": "Autoscaling delay",
    "traffic_anomaly_score": "Traffic anomaly score",
}


class RiskEngine:
    def __init__(self) -> None:
        self.weights = dict(_DEFAULT_WEIGHTS)
        self.thresholds = {key: dict(value) for key, value in _DEFAULT_THRESHOLDS.items()}
        self.classification_thresholds = {
            "moderate": 25,
            "high": 50,
            "critical": 75,
        }

    def update_config(
        self,
        weights: dict[str, float],
        thresholds: dict[str, dict[str, float]],
        classification_thresholds: dict[str, int],
    ) -> dict[str, Any]:
        if set(weights) != set(_DEFAULT_WEIGHTS):
            raise ValueError("Weights must include exactly the ten supported risk factors.")
        if any(not 0 <= weight <= 5 for weight in weights.values()):
            raise ValueError("Each factor weight must be between 0 and 5.")
        if not any(weights.values()):
            raise ValueError("At least one risk factor weight must be greater than zero.")
        if set(thresholds) != set(_DEFAULT_THRESHOLDS):
            raise ValueError("Thresholds must include exactly the ten supported risk factors.")
        for key, values in thresholds.items():
            if set(values) != {"warning", "critical"}:
                raise ValueError(f"{key} must include warning and critical thresholds.")
            if any(not 0 <= value <= 100000 for value in values.values()):
                raise ValueError(f"{key} thresholds must be between 0 and 100000.")
            if key == "pod_health":
                valid_order = values["critical"] < values["warning"]
            else:
                valid_order = values["warning"] < values["critical"]
            if not valid_order:
                raise ValueError(f"{key} warning and critical thresholds are not ordered correctly.")
        if set(classification_thresholds) != {"moderate", "high", "critical"}:
            raise ValueError("Classification thresholds must include moderate, high, and critical.")
        moderate = classification_thresholds["moderate"]
        high = classification_thresholds["high"]
        critical = classification_thresholds["critical"]
        if not (1 <= moderate < high < critical <= 100):
            raise ValueError("Classification thresholds must be strictly increasing from 1 to 100.")

        self.weights = dict(weights)
        self.thresholds = {key: dict(value) for key, value in thresholds.items()}
        self.classification_thresholds = dict(classification_thresholds)
        return self.get_config()

    def get_config(self) -> dict[str, Any]:
        return {
            "weights": dict(self.weights),
            "thresholds": {key: dict(value) for key, value in self.thresholds.items()},
            "classification_thresholds": dict(self.classification_thresholds),
            "scope": "Process-local configuration; not persisted across restarts.",
        }

    def calculate(self) -> dict[str, Any]:
        snapshot = metrics_collector.snapshot()
        history = list(metrics_collector.history)
        factors = self._factors(snapshot, history)

        def weighted_score(keys: list[str]) -> float | None:
            included = [
                (factor, self.weights[factor["key"]])
                for factor in factors
                if factor["key"] in keys
                and factor["normalized_score"] is not None
                and self.weights[factor["key"]] > 0
            ]
            weight_sum = sum(weight for _, weight in included)
            if not weight_sum:
                return None
            return round(sum(item["normalized_score"] * weight for item, weight in included) / weight_sum, 1)

        overall = weighted_score(list(_DEFAULT_WEIGHTS))
        overload = weighted_score([
            "p95_latency", "cpu_utilization", "memory_utilization",
            "queue_depth", "pod_health", "pod_restart_frequency", "autoscaling_delay",
        ])
        traffic = weighted_score(["request_rate_anomaly", "traffic_anomaly_score"])
        availability = weighted_score(["http_error_rate", "pod_health"])
        classification = self._classify(overall)
        ranked = sorted(
            (
                factor for factor in factors
                if factor["normalized_score"] is not None and factor["normalized_score"] > 0
            ),
            key=lambda factor: factor["normalized_score"] * self.weights[factor["key"]],
            reverse=True,
        )
        contributors = ranked[:3]
        explanation = self._explanation(classification, contributors, overall)
        return {
            "score": overall,
            "classification": classification,
            "risk_by_category": {
                "infrastructure_overload": overload,
                "traffic_anomaly": traffic,
                "service_availability": availability,
            },
            "coverage": {
                "available_factors": sum(
                    factor["normalized_score"] is not None for factor in factors
                ),
                "total_factors": len(factors),
                "note": "Unknown integrations are excluded from the weighted score, not treated as healthy.",
            },
            "top_contributors": contributors,
            "factors": factors,
            "threshold_violations": [
                factor for factor in factors
                if factor["threshold_status"] in {"warning", "critical"}
            ],
            "explanation": explanation,
            "recommended_action": self._recommended_action(classification, contributors),
            "calculated_at": snapshot["timestamp"],
            "metrics_source": snapshot["metrics_source"],
            "metrics_scope": snapshot["metrics_scope"],
            "configuration": self.get_config(),
        }

    def _factors(
        self,
        snapshot: dict[str, Any],
        history: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        historical_rates = [
            point["requests_per_second"]
            for point in history
            if point.get("requests_per_second") is not None
        ]
        current_rate = snapshot["requests_per_second"]
        baseline_rate = None
        if len(historical_rates) >= 2:
            baseline_points = historical_rates[:-5] or historical_rates[:-1]
            baseline_rate = round(sum(baseline_points) / len(baseline_points), 2)

        rate_factor = self._factor(
            "request_rate_anomaly",
            current_rate if baseline_rate is not None else None,
            "requests/second",
            baseline_rate,
            (
                round(baseline_rate * self.thresholds["request_rate_anomaly"]["warning"], 2),
                round(max(1, baseline_rate * self.thresholds["request_rate_anomaly"]["critical"]), 2),
            )
            if baseline_rate is not None else None,
            "Measured one-second request rate compared with the sampled historical baseline.",
        )

        latency_factor = self._factor(
            "p95_latency",
            snapshot["p95_latency_ms"],
            "ms",
            None,
            self._threshold_pair("p95_latency"),
            "P95 is calculated from observed HTTP request durations.",
        )
        error_factor = self._factor(
            "http_error_rate",
            snapshot["error_rate_percent"],
            "%",
            None,
            self._threshold_pair("http_error_rate"),
            "HTTP responses with status 400 or above divided by observed requests in the last minute.",
        )

        cpu_baseline = self._history_baseline(history, "cpu_utilization_percent")
        memory_baseline = self._history_baseline(history, "memory_utilization_percent")
        cpu_factor = self._factor(
            "cpu_utilization", snapshot["cpu_utilization_percent"], "%",
            cpu_baseline, self._threshold_pair("cpu_utilization"),
            "Measured host CPU utilization; this is not per-container CPU.",
        )
        memory_factor = self._factor(
            "memory_utilization", snapshot["memory_utilization_percent"], "%",
            memory_baseline, self._threshold_pair("memory_utilization"),
            "Measured host memory utilization; this is not per-container memory.",
        )

        return [
            rate_factor,
            latency_factor,
            error_factor,
            cpu_factor,
            memory_factor,
            self._factor(
                "queue_depth", None, "items", None, self._threshold_pair("queue_depth"),
                "Queue depth integration is not configured.",
            ),
            self._factor(
                "pod_health", None, "%", None, self._threshold_pair("pod_health"),
                "Kubernetes pod health is not integrated.",
            ),
            self._factor(
                "pod_restart_frequency", None, "restarts/min",
                None, self._threshold_pair("pod_restart_frequency"),
                "Kubernetes restart telemetry is not integrated.",
            ),
            self._factor(
                "autoscaling_delay", None, "seconds",
                None, self._threshold_pair("autoscaling_delay"),
                "Autoscaling event telemetry is not integrated.",
            ),
            self._factor(
                "traffic_anomaly_score", None, "score",
                None, self._threshold_pair("traffic_anomaly_score"),
                "No validated anomaly-detection model is configured.",
            ),
        ]

    @staticmethod
    def _history_baseline(history: list[dict[str, Any]], key: str) -> float | None:
        values = [point[key] for point in history[:-5] if point.get(key) is not None]
        return round(sum(values) / len(values), 2) if values else None

    def _factor(
        self,
        key: str,
        value: float | None,
        unit: str,
        baseline: float | None,
        thresholds: tuple[float, float] | None,
        evidence: str,
    ) -> dict[str, Any]:
        score = None
        if value is not None and thresholds is not None:
            warning, critical = thresholds
            if key == "pod_health":
                score = 0.0 if value >= warning else round(
                    min(100.0, (warning - value) * 100 / max(warning - critical, 0.0001)),
                    1,
                )
            else:
                score = 0.0 if value <= warning else round(
                    min(100.0, (value - warning) * 100 / max(critical - warning, 0.0001)),
                    1,
                )
        return {
            "key": key,
            "label": _FACTOR_LABELS[key],
            "value": value,
            "unit": unit,
            "baseline": baseline,
            "warning_threshold": thresholds[0] if thresholds else None,
            "critical_threshold": thresholds[1] if thresholds else None,
            "normalized_score": score,
            "threshold_status": (
                "unknown" if score is None
                else "critical" if score >= 100
                else "warning" if score > 0
                else "normal"
            ),
            "weight": self.weights[key],
            "available": score is not None,
            "evidence": evidence,
        }

    def _threshold_pair(self, key: str) -> tuple[float, float]:
        values = self.thresholds[key]
        return (values["warning"], values["critical"])

    def _classify(self, score: float | None) -> str:
        if score is None:
            return "unknown"
        if score >= self.classification_thresholds["critical"]:
            return "critical"
        if score >= self.classification_thresholds["high"]:
            return "high"
        if score >= self.classification_thresholds["moderate"]:
            return "moderate"
        return "low"

    @staticmethod
    def _explanation(
        classification: str,
        contributors: list[dict[str, Any]],
        score: float | None,
    ) -> str:
        if score is None:
            return "Risk is unknown because no configured factors currently have enough measured data."
        if not contributors or all(item["normalized_score"] == 0 for item in contributors):
            return f"Risk is {classification} based on currently measured factors; no configured warning thresholds are exceeded."
        evidence = ", ".join(
            (
                f'{item["label"]} measured {item["value"]} {item["unit"]}, '
                f'{item["threshold_status"]} threshold {item["warning_threshold"]} {item["unit"]}'
            )
            for item in contributors
        )
        return f"Risk is {classification} (score {score}/100) because {evidence}."

    @staticmethod
    def _recommended_action(classification: str, contributors: list[dict[str, Any]]) -> str:
        if classification == "unknown":
            return "Collect more request samples and configure the missing queue, Kubernetes, and model integrations."
        if contributors and classification in {"high", "critical"}:
            return (
                f"Investigate {contributors[0]['label'].lower()} first. "
                "Review the measured values and validate service health before changing infrastructure."
            )
        if contributors:
            return (
                f"Overall risk is {classification}, but {contributors[0]['label'].lower()} "
                "exceeds its warning threshold. Review the trend and confirm alert thresholds."
            )
        if classification == "moderate":
            return "Review the contributing measurements and confirm alert thresholds; no automatic infrastructure action was taken."
        return "Continue monitoring. No measured factor currently exceeds its configured warning threshold."


risk_engine = RiskEngine()
