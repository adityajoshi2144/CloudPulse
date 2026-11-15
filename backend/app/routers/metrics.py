from fastapi import APIRouter, HTTPException, Query, Response
from app.core.metrics_collector import metrics_collector
from app.core.telemetry_state import telemetry_state

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.get("/overview")
async def get_overview():
    """Real-time cluster overview for Executive Dashboard."""
    return telemetry_state.get_system_overview()

@router.get("/live")
async def get_live_metrics():
    """Measured metrics sampled over the last minute."""
    data = metrics_collector.get_history(60)
    return {
        "count": len(data),
        "data": data
    }

@router.get("/history")
async def get_history(range_window: str = Query("15m", alias="range")):
    """Return measured samples within the selected retention window."""
    windows = {"1m": 60, "5m": 300, "15m": 900, "1h": 3600}
    if range_window not in windows:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported range. Choose one of: {', '.join(windows)}",
        )
    data = metrics_collector.get_history(windows[range_window])
    return {
        "range": range_window,
        "points": len(data),
        "data": data
    }

@router.get("", tags=["Prometheus"])
@router.get("/prometheus", tags=["Prometheus"])
def get_prometheus_metrics():
    """Expose measured process metrics for Prometheus scraping."""
    overview = metrics_collector.snapshot()
    lines = [
        "# HELP cloudpulse_http_requests_total Total application HTTP requests observed by middleware.",
        "# TYPE cloudpulse_http_requests_total counter",
        f"cloudpulse_http_requests_total {metrics_collector.total_requests}",
        "# HELP cloudpulse_http_request_duration_seconds Application request latency summary in seconds.",
        "# TYPE cloudpulse_http_request_duration_seconds summary",
        f'cloudpulse_http_request_duration_seconds{{quantile="0.95"}} {overview["p95_latency_ms"] / 1000 if overview["p95_latency_ms"] is not None else "NaN"}',
        f'cloudpulse_http_request_duration_seconds{{quantile="0.99"}} {overview["p99_latency_ms"] / 1000 if overview["p99_latency_ms"] is not None else "NaN"}',
        f"cloudpulse_http_request_duration_seconds_sum {metrics_collector.total_duration_seconds}",
        f"cloudpulse_http_request_duration_seconds_count {metrics_collector.total_requests}",
        "# HELP cloudpulse_requests_per_second Requests observed in the last one-second window.",
        "# TYPE cloudpulse_requests_per_second gauge",
        f"cloudpulse_requests_per_second {overview['requests_per_second']}",
        "# HELP cloudpulse_error_rate_ratio HTTP errors divided by observed requests in the last minute.",
        "# TYPE cloudpulse_error_rate_ratio gauge",
        f"cloudpulse_error_rate_ratio {overview['error_rate_percent'] / 100 if overview['error_rate_percent'] is not None else 'NaN'}",
        "# HELP cloudpulse_host_cpu_utilization_ratio Host CPU utilization.",
        "# TYPE cloudpulse_host_cpu_utilization_ratio gauge",
        f"cloudpulse_host_cpu_utilization_ratio {overview['cpu_utilization_percent'] / 100}",
        "# HELP cloudpulse_host_memory_utilization_ratio Host memory utilization.",
        "# TYPE cloudpulse_host_memory_utilization_ratio gauge",
        f"cloudpulse_host_memory_utilization_ratio {overview['memory_utilization_percent'] / 100}",
        "# HELP cloudpulse_process_memory_utilization_ratio CloudPulse process memory as a fraction of host memory.",
        "# TYPE cloudpulse_process_memory_utilization_ratio gauge",
        f"cloudpulse_process_memory_utilization_ratio {overview['process_memory_percent'] / 100}",
    ]
    if overview["database_response_time_ms"] is not None:
        lines.extend([
            "# HELP cloudpulse_database_probe_duration_seconds Last measured database health probe duration.",
            "# TYPE cloudpulse_database_probe_duration_seconds gauge",
            f"cloudpulse_database_probe_duration_seconds {overview['database_response_time_ms'] / 1000}",
        ])
    return Response(
        content="\n".join(lines) + "\n",
        media_type="text/plain; version=0.0.4; charset=utf-8",
    )
