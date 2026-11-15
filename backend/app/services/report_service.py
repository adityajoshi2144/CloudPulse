from __future__ import annotations

import csv
import io
import json
import re
import uuid
from datetime import datetime, timezone
from typing import Any


_METRIC_KEYS = (
    "requests_per_second",
    "requests_per_minute",
    "avg_latency_ms",
    "p95_latency_ms",
    "p99_latency_ms",
    "error_rate_percent",
    "cpu_utilization_percent",
    "memory_utilization_percent",
    "database_response_time_ms",
)


class ReportService:
    def __init__(self) -> None:
        self._reports: list[dict[str, Any]] = []

    def record_simulation(
        self,
        *,
        config: Any,
        status: str,
        requests_sent: int,
        errors_seen: int,
        elapsed_seconds: int,
        timeline: list[dict[str, Any]],
        metrics_before: dict[str, Any],
        metrics_after: dict[str, Any],
        risk_before: dict[str, Any],
        risk_after: dict[str, Any],
        test_endpoint_available: bool,
    ) -> dict[str, Any]:
        deltas = {
            key: round(metrics_after[key] - metrics_before[key], 2)
            for key in _METRIC_KEYS
            if isinstance(metrics_before.get(key), (int, float))
            and isinstance(metrics_after.get(key), (int, float))
        }
        report = {
            "id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "started_at": metrics_before["timestamp"],
            "completed_at": metrics_after["timestamp"],
            "scenario": config.pattern,
            "status": status,
            "target_service": config.target_service,
            "safety_scope": "In-process HTTP requests to CloudPulse's local test endpoint only.",
            "workload": {
                "intensity": config.intensity,
                "concurrency": config.virtual_users,
                "duration_seconds": config.duration_seconds,
                "elapsed_seconds": elapsed_seconds,
                "request_cap": config.max_requests,
                "requests_sent": requests_sent,
                "errors_seen": errors_seen,
            },
            "risk_before": {
                "score": risk_before["score"],
                "classification": risk_before["classification"],
                "top_contributors": risk_before["top_contributors"],
            },
            "risk_after": {
                "score": risk_after["score"],
                "classification": risk_after["classification"],
                "top_contributors": risk_after["top_contributors"],
            },
            "metrics_before": {key: metrics_before.get(key) for key in _METRIC_KEYS},
            "metrics_after": {key: metrics_after.get(key) for key in _METRIC_KEYS},
            "metric_deltas": deltas,
            "scaling_events": [],
            "scaling_note": "No Kubernetes adapter was invoked; local simulations do not change infrastructure replicas.",
            "recovery": {
                "test_endpoint_available": test_endpoint_available,
                "scope": "Dedicated local simulation endpoint only.",
            },
            "metrics_scope": metrics_after["metrics_scope"],
            "timeline": list(timeline),
        }
        self._reports.insert(0, report)
        del self._reports[50:]
        return report

    def list_reports(self) -> list[dict[str, Any]]:
        return [
            {key: value for key, value in report.items() if key != "timeline"}
            for report in self._reports
        ]

    def get_report(self, report_id: str) -> dict[str, Any] | None:
        return next((report for report in self._reports if report["id"] == report_id), None)

    @staticmethod
    def to_csv(report: dict[str, Any]) -> str:
        output = io.StringIO(newline="")
        writer = csv.DictWriter(output, fieldnames=[
            "report_id", "scenario", "status", "created_at",
            "target_service", "intensity", "concurrency", "duration_seconds",
            "request_cap", "requests_sent", "errors_seen",
            "risk_before", "risk_after", "metrics_before", "metrics_after",
            "metric_deltas", "scaling_events", "recovery", "timeline",
        ])
        writer.writeheader()
        writer.writerow({
            "report_id": report["id"],
            "scenario": report["scenario"],
            "status": report["status"],
            "created_at": report["created_at"],
            "target_service": report["target_service"],
            "intensity": report["workload"]["intensity"],
            "concurrency": report["workload"]["concurrency"],
            "duration_seconds": report["workload"]["duration_seconds"],
            "request_cap": report["workload"]["request_cap"],
            "requests_sent": report["workload"]["requests_sent"],
            "errors_seen": report["workload"]["errors_seen"],
            "risk_before": json.dumps(report["risk_before"], separators=(",", ":")),
            "risk_after": json.dumps(report["risk_after"], separators=(",", ":")),
            "metrics_before": json.dumps(report["metrics_before"], separators=(",", ":")),
            "metrics_after": json.dumps(report["metrics_after"], separators=(",", ":")),
            "metric_deltas": json.dumps(report["metric_deltas"], separators=(",", ":")),
            "scaling_events": json.dumps(report["scaling_events"]),
            "recovery": json.dumps(report["recovery"]),
            "timeline": json.dumps(report["timeline"], separators=(",", ":")),
        })
        return output.getvalue()

    @staticmethod
    def to_pdf(report: dict[str, Any]) -> bytes:
        workload = report["workload"]
        lines = [
            "CloudPulse - Simulation Report",
            f"Report: {report['id']}",
            f"Created: {report['created_at']}",
            f"Scenario: {report['scenario']} ({report['status']})",
            f"Target: {report['target_service']} - local endpoint only",
            f"Workload: {workload['requests_sent']} requests, {workload['errors_seen']} errors,",
            f"{workload['concurrency']} concurrent, {workload['elapsed_seconds']} seconds elapsed.",
            f"Risk before: {report['risk_before']['score']} ({report['risk_before']['classification']})",
            f"Risk after: {report['risk_after']['score']} ({report['risk_after']['classification']})",
            "Measured before / after:",
        ]
        for key in _METRIC_KEYS:
            lines.append(f"{key}: {report['metrics_before'][key]} -> {report['metrics_after'][key]}")
        lines.extend([
            "Scaling events: none; no Kubernetes adapter was invoked.",
            f"Local test endpoint recovered: {report['recovery']['test_endpoint_available']}",
            f"Telemetry scope: {report['metrics_scope']}",
            "Risk contributors after: " + ", ".join(
                item["label"] for item in report["risk_after"]["top_contributors"]
            ),
        ])
        safe_lines = [
            re.sub(r"[^\x20-\x7e]", "?", str(line)).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            for line in lines
        ]
        stream = "BT\n/F1 10 Tf\n50 790 Td\n12 TL\n"
        stream += "\n".join(f"({line}) Tj T*" for line in safe_lines)
        stream += "\nET"
        stream_bytes = stream.encode("ascii")
        objects = [
            b"<< /Type /Catalog /Pages 2 0 R >>",
            b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            b"<< /Length " + str(len(stream_bytes)).encode("ascii") + b" >>\nstream\n" + stream_bytes + b"\nendstream",
        ]
        pdf = bytearray(b"%PDF-1.4\n")
        offsets = [0]
        for index, obj in enumerate(objects, start=1):
            offsets.append(len(pdf))
            pdf.extend(f"{index} 0 obj\n".encode("ascii"))
            pdf.extend(obj)
            pdf.extend(b"\nendobj\n")
        xref_offset = len(pdf)
        pdf.extend(f"xref\n0 {len(offsets)}\n".encode("ascii"))
        pdf.extend(b"0000000000 65535 f \n")
        for offset in offsets[1:]:
            pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
        pdf.extend(
            f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode("ascii")
        )
        return bytes(pdf)


report_service = ReportService()
