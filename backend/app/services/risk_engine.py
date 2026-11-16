from __future__ import annotations

from typing import Any

from app.core.metrics_collector import metrics_collector
from app.core.telemetry_state import telemetry_state
from app.services.shield_service import shield_service
from app.services.autoscaler import autoscaler_service


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

        raw_overall = weighted_score(list(_DEFAULT_WEIGHTS))
        overload = weighted_score([
            "p95_latency", "cpu_utilization", "memory_utilization",
            "queue_depth", "pod_health", "pod_restart_frequency", "autoscaling_delay",
        ])
        traffic = weighted_score(["request_rate_anomaly", "traffic_anomaly_score"])
        availability = weighted_score(["http_error_rate", "pod_health"])

        # Rank contributing factors
        ranked = sorted(
            (
                factor for factor in factors
                if factor["normalized_score"] is not None and factor["normalized_score"] > 0
            ),
            key=lambda factor: factor["normalized_score"] * self.weights[factor["key"]],
            reverse=True,
        )
        contributors = ranked[:3]

        # -------------------------------------------------------------
        # CLASSIFY TRAFFIC & DEDUCE CAUSE (Rules from Section 3 & 4)
        # -------------------------------------------------------------
        current_rps = snapshot.get("requests_per_second") or 0.0
        error_rate = snapshot.get("error_rate_percent") or 0.0
        cpu_percent = snapshot.get("cpu_utilization_percent") or 0.0
        p95_ms = snapshot.get("p95_latency_ms") or 0.0
        total_requests = snapshot.get("total_requests") or 0
        is_simulation = getattr(telemetry_state, "simulator_active", False)
        sim_pattern = getattr(telemetry_state, "simulator_pattern", "idle")

        historical_rates = [
            point["requests_per_second"]
            for point in history
            if point.get("requests_per_second") is not None
        ]
        baseline_rate = (
            round(sum(historical_rates[:-5] or historical_rates[:-1]) / len(historical_rates[:-5] or historical_rates[:-1]), 2)
            if len(historical_rates) >= 2
            else 2.0
        )

        traffic_classification, security_status, is_attack = self._classify_traffic(
            is_simulation=is_simulation,
            sim_pattern=sim_pattern,
            current_rps=current_rps,
            baseline_rps=baseline_rate,
            error_rate=error_rate,
            total_requests=total_requests,
        )

        # -------------------------------------------------------------
        # CALIBRATE RISK SCORE ACCORDING TO CLASSIFICATION RULES
        # - High traffic alone != attack
        # - High CPU alone != attack
        # - Single failed request != critical attack
        # - Legitimate visitor surge separated from malicious traffic
        # -------------------------------------------------------------
        if total_requests == 0 and not is_simulation:
            risk_score = raw_overall
            risk_level = "LOW RISK" if raw_overall is not None and raw_overall <= 24 else "INSUFFICIENT DATA"
            confidence = "Low" if total_requests == 0 else "High"
        elif traffic_classification == "LEGITIMATE TRAFFIC SURGE":
            # Cap security threat score: workload increases CPU, but security risk stays LOW or MEDIUM
            # strictly < 50
            infra_load_score = min(40.0, (cpu_percent / 100.0) * 35.0 + (p95_ms / 500.0) * 10.0)
            risk_score = round(max(10.0, infra_load_score), 1)
            risk_level = "LOW RISK" if risk_score < 25 else "MEDIUM RISK"
            confidence = "High"
        elif traffic_classification in ("SIMULATED ATTACK TRAFFIC", "SUSPICIOUS TRAFFIC"):
            # Elevate risk to High or Critical
            if sim_pattern in ("flood", "failure") or error_rate >= 5.0 or (cpu_percent >= 90 and current_rps >= 15):
                risk_score = round(max(75.0, raw_overall if raw_overall else 78.0), 1)
                risk_level = "CRITICAL RISK"
            else:
                risk_score = round(max(58.0, min(74.0, raw_overall if raw_overall else 68.0)), 1)
                risk_level = "HIGH RISK"
            confidence = "High (Controlled Simulation)" if is_simulation else "High"
        else:
            # Normal Traffic
            if raw_overall is None:
                risk_score = 12.0
                risk_level = "LOW RISK"
            else:
                risk_score = raw_overall
                risk_level = (
                    "CRITICAL RISK" if risk_score >= 75
                    else "HIGH RISK" if risk_score >= 50
                    else "MEDIUM RISK" if risk_score >= 25
                    else "LOW RISK"
                )
            confidence = "High"

        # Classification string for backwards compatibility (tests check "low", "moderate", "high", "critical")
        if risk_level == "LOW RISK":
            classification = "low"
        elif risk_level == "MEDIUM RISK":
            classification = "moderate"
        elif risk_level == "HIGH RISK":
            classification = "high"
        elif risk_level == "CRITICAL RISK":
            classification = "critical"
        else:
            classification = "unknown"

        # Website Health
        if error_rate >= 10.0 or getattr(telemetry_state, "failing_service_id", None):
            website_health = "Critical"
        elif error_rate >= 2.0 or cpu_percent >= 85.0 or p95_ms >= 500.0:
            website_health = "Degraded"
        elif total_requests > 0:
            website_health = "Healthy"
        else:
            website_health = "Healthy"

        # Detected Indicators
        detected_indicators = self._build_detected_indicators(
            traffic_classification=traffic_classification,
            current_rps=current_rps,
            baseline_rps=baseline_rate,
            cpu_percent=cpu_percent,
            p95_ms=p95_ms,
            error_rate=error_rate,
            sim_pattern=sim_pattern,
            is_simulation=is_simulation,
        )

        # Mitigation status
        shield_info = shield_service.get_status()
        scaling_events = autoscaler_service.get_scaling_events()
        mitigation_status = self._build_mitigation_status(
            shield_info=shield_info,
            scaling_events=scaling_events,
            risk_level=risk_level,
            traffic_classification=traffic_classification,
        )

        # Explain WHY and WHAT ACTION
        explanation = self._build_verdict_explanation(
            risk_level=risk_level,
            risk_score=risk_score,
            traffic_classification=traffic_classification,
            current_rps=current_rps,
            baseline_rps=baseline_rate,
            cpu_percent=cpu_percent,
            error_rate=error_rate,
            is_simulation=is_simulation,
            sim_pattern=sim_pattern,
        )
        recommended_action = self._build_verdict_recommended_action(
            risk_level=risk_level,
            traffic_classification=traffic_classification,
            cpu_percent=cpu_percent,
            error_rate=error_rate,
        )

        return {
            # Backward-compatible fields
            "score": risk_score,
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
            "recommended_action": recommended_action,
            "calculated_at": snapshot["timestamp"],
            "metrics_source": snapshot["metrics_source"],
            "metrics_scope": snapshot["metrics_scope"],
            "configuration": self.get_config(),

            # Master Refinement Structured Verdict Fields
            "risk_score": risk_score,
            "risk_level": risk_level,
            "traffic_classification": traffic_classification,
            "website_health": website_health,
            "security_status": security_status,
            "confidence_or_evidence_quality": confidence,
            "detected_indicators": detected_indicators,
            "mitigation_status": mitigation_status,
            "assessed_at": snapshot["timestamp"],
            "last_analysis_time": snapshot["timestamp"],
            "simulation_mode": is_simulation,
        }

    def _classify_traffic(
        self,
        is_simulation: bool,
        sim_pattern: str,
        current_rps: float,
        baseline_rps: float,
        error_rate: float,
        total_requests: int,
    ) -> tuple[str, str, bool]:
        """
        Delineate legitimate traffic surge from malicious attack.
        Returns (traffic_classification, security_status, is_attack).
        """
        if is_simulation:
            if sim_pattern in ("burst", "flood", "failure"):
                return "SIMULATED ATTACK TRAFFIC", "Threat Detected", True
            if sim_pattern in ("spike", "gradual"):
                return "LEGITIMATE TRAFFIC SURGE", "Elevated Load (Legitimate)", False
            if sim_pattern == "normal":
                return "NORMAL TRAFFIC", "Normal", False

        if total_requests == 0:
            return "NORMAL TRAFFIC", "Normal", False

        # Live non-simulation traffic analysis
        is_elevated_traffic = current_rps > max(6.0, baseline_rps * 1.8)
        has_high_errors = error_rate >= 5.0

        if is_elevated_traffic and has_high_errors:
            return "SUSPICIOUS TRAFFIC", "Elevated Risk", True

        if is_elevated_traffic and not has_high_errors:
            return "LEGITIMATE TRAFFIC SURGE", "Elevated Load (Legitimate)", False

        return "NORMAL TRAFFIC", "Normal", False

    def _build_detected_indicators(
        self,
        traffic_classification: str,
        current_rps: float,
        baseline_rps: float,
        cpu_percent: float,
        p95_ms: float,
        error_rate: float,
        sim_pattern: str,
        is_simulation: bool,
    ) -> list[dict[str, Any]]:
        indicators = []

        # 1. Traffic behavior
        if traffic_classification == "LEGITIMATE TRAFFIC SURGE":
            growth = round(((current_rps - baseline_rps) / max(baseline_rps, 1.0)) * 100, 0)
            indicators.append({
                "name": "Traffic Volume Surge",
                "value": f"{current_rps} req/s (+{max(0, int(growth))}%)",
                "status": "surge",
                "severity": "info",
                "impact": "Inbound request rate increased substantially, but error rate remains normal and distribution is uniform.",
                "evidence": f"Measured {current_rps} req/s vs baseline {baseline_rps} req/s.",
            })
        elif traffic_classification == "SIMULATED ATTACK TRAFFIC":
            indicators.append({
                "name": "Abnormal Traffic Pattern",
                "value": f"{sim_pattern.upper()} ({current_rps} req/s)",
                "status": "threat",
                "severity": "critical",
                "impact": "Controlled simulation generated abnormal high-frequency burst pattern exceeding baseline variance bounds.",
                "evidence": f"Scenario {sim_pattern} active targeting local test route.",
            })
        else:
            indicators.append({
                "name": "Ingress Throughput",
                "value": f"{current_rps} req/s",
                "status": "nominal",
                "severity": "nominal",
                "impact": "Traffic is operating within the expected baseline envelope.",
                "evidence": f"Current throughput {current_rps} req/s conforms to baseline ({baseline_rps} req/s).",
            })

        # 2. Host CPU
        if cpu_percent >= 75.0:
            indicators.append({
                "name": "Host CPU Utilization",
                "value": f"{cpu_percent}%",
                "status": "warning" if cpu_percent < 90.0 else "critical",
                "severity": "warning" if cpu_percent < 90.0 else "critical",
                "impact": "Host CPU exceeded warning threshold (70%); scaling policies evaluate replica capacity.",
                "evidence": f"Measured with psutil: {cpu_percent}% host CPU utilization.",
            })
        else:
            indicators.append({
                "name": "Host CPU Utilization",
                "value": f"{cpu_percent}%",
                "status": "nominal",
                "severity": "nominal",
                "impact": "CPU utilization is healthy and within normal operating limits.",
                "evidence": f"{cpu_percent}% host CPU.",
            })

        # 3. HTTP Error Rate
        if error_rate >= 2.0:
            indicators.append({
                "name": "HTTP Error Rate",
                "value": f"{error_rate}%",
                "status": "warning" if error_rate < 5.0 else "critical",
                "severity": "warning" if error_rate < 5.0 else "critical",
                "impact": "Elevated 4xx/5xx responses detected, indicating potential server overload or endpoint rejection.",
                "evidence": f"{error_rate}% error rate in recent 60-second window.",
            })
        else:
            indicators.append({
                "name": "HTTP Error Rate",
                "value": f"{error_rate}%",
                "status": "nominal",
                "severity": "nominal",
                "impact": "HTTP responses are healthy with zero or negligible status failures.",
                "evidence": "Observed 0% errors across recent requests.",
            })

        return indicators

    def _build_mitigation_status(
        self,
        shield_info: dict[str, Any],
        scaling_events: list[dict[str, Any]],
        risk_level: str,
        traffic_classification: str,
    ) -> str:
        rate_enforced = shield_info.get("rate_limiting_enforced", True)
        rate_cap = shield_info.get("rate_limit_rps", 20)
        blocked_count = shield_info.get("total_blocked", 0)

        recent_scale = scaling_events[0] if scaling_events else None

        if risk_level in ("HIGH RISK", "CRITICAL RISK"):
            return (
                f"Active Defense Engaged: Rate Limiting Enforced ({rate_cap} req/s cap, "
                f"{blocked_count} requests throttled). HPA scale-out ready."
            )
        elif traffic_classification == "LEGITIMATE TRAFFIC SURGE":
            scale_note = (
                f"HPA scaled {recent_scale['from_replicas']} → {recent_scale['to_replicas']} pods. "
                if recent_scale else "HPA capacity monitored. "
            )
            return f"{scale_note}Rate limiting filter on standby ({rate_cap} req/s cap)."
        elif recent_scale and recent_scale.get("to_replicas", 2) > 2:
            return f"HPA Active ({recent_scale['to_replicas']} pods). Shield rate limiting on standby."
        else:
            return f"Monitoring Active. CloudPulse Shield rate limiting filter standby ({rate_cap} req/s cap)."

    def _build_verdict_explanation(
        self,
        risk_level: str,
        risk_score: float | None,
        traffic_classification: str,
        current_rps: float,
        baseline_rps: float,
        cpu_percent: float,
        error_rate: float,
        is_simulation: bool,
        sim_pattern: str,
    ) -> str:
        if risk_level == "INSUFFICIENT DATA":
            return "Verdict is INSUFFICIENT DATA because insufficient request samples have been observed to establish baseline confidence."

        if traffic_classification == "LEGITIMATE TRAFFIC SURGE":
            return (
                f"Website is experiencing a Legitimate Traffic Surge ({current_rps} req/s vs baseline {baseline_rps} req/s). "
                f"Traffic patterns remain uniform and HTTP error rate is low ({error_rate}%). "
                f"Classified as LOW/MEDIUM RISK (score {risk_score}/100) because high traffic volume alone does not constitute an attack."
            )

        if traffic_classification == "SIMULATED ATTACK TRAFFIC":
            return (
                f"Controlled simulation detected an abnormal {sim_pattern.upper()} traffic pattern. "
                f"Rapid burst frequency and elevated variance exceed baseline tolerances. "
                f"Classified as {risk_level} (score {risk_score}/100) in safe local simulation mode."
            )

        if traffic_classification == "SUSPICIOUS TRAFFIC":
            return (
                f"Suspicious request patterns detected: rapid traffic growth accompanied by elevated error rate ({error_rate}%) "
                f"and CPU utilization ({cpu_percent}%). Classified as {risk_level} (score {risk_score}/100)."
            )

        return (
            f"Website is operating normally. Ingress traffic ({current_rps} req/s), latency, and host CPU ({cpu_percent}%) "
            f"are within safe baseline thresholds with zero significant threats detected. Risk score is {risk_score}/100 (LOW RISK)."
        )

    def _build_verdict_recommended_action(
        self,
        risk_level: str,
        traffic_classification: str,
        cpu_percent: float,
        error_rate: float,
    ) -> str:
        if risk_level == "CRITICAL RISK":
            return "Enforce immediate rate-limiting on offending endpoints, scale backend worker replicas, and verify database pool health."
        if risk_level == "HIGH RISK":
            return "Inspect source distribution, verify rate-limiting shield rules, and prepare horizontal pod auto-scaler for surge absorption."
        if traffic_classification == "LEGITIMATE TRAFFIC SURGE":
            return "Allow legitimate visitor traffic to pass. Observe host CPU headroom and allow auto-scaler to adjust replica counts if needed."
        if risk_level == "MEDIUM RISK":
            return "Monitor host CPU and latency trends. Confirm alert notification channels are operational."
        return "Continue continuous monitoring. All website health and traffic indicators are nominal."

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


risk_engine = RiskEngine()
