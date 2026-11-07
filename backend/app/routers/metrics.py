import time
from fastapi import APIRouter, Query, Response
from app.core.telemetry_state import telemetry_state

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.get("/overview")
async def get_overview():
    """Real-time cluster overview for Executive Dashboard."""
    return telemetry_state.get_system_overview()

@router.get("/live")
async def get_live_metrics():
    """Recent 60 seconds time series data for live-updating charts."""
    return {
        "count": len(telemetry_state.history_1m),
        "data": telemetry_state.history_1m
    }

@router.get("/history")
async def get_history(range_window: str = Query("15m", alias="range")):
    """Historical time-series sampled over specified time window."""
    data = list(telemetry_state.history_1m)
    # If longer window requested, interpolate or return sampled buffer
    return {
        "range": range_window,
        "points": len(data),
        "data": data
    }

@router.get("/prometheus", tags=["Prometheus"])
def get_prometheus_metrics():
    """Prometheus exposition format for scraping."""
    overview = telemetry_state.get_system_overview()
    lines = [
        "# HELP cloudpulse_http_requests_total Total number of HTTP requests processed.",
        "# TYPE cloudpulse_http_requests_total counter",
        f"cloudpulse_http_requests_total {overview['total_rps'] * 1000}",
        "# HELP cloudpulse_http_request_duration_p95_seconds P95 latency in seconds.",
        "# TYPE cloudpulse_http_request_duration_p95_seconds gauge",
        f"cloudpulse_http_request_duration_p95_seconds {overview['p95_latency_ms'] / 1000.0}",
        "# HELP cloudpulse_cpu_utilization_ratio Average CPU utilization across pods.",
        "# TYPE cloudpulse_cpu_utilization_ratio gauge",
        f"cloudpulse_cpu_utilization_ratio {overview['cpu_utilization_percent'] / 100.0}",
        "# HELP cloudpulse_memory_utilization_ratio Average Memory utilization.",
        "# TYPE cloudpulse_memory_utilization_ratio gauge",
        f"cloudpulse_memory_utilization_ratio {overview['memory_utilization_percent'] / 100.0}",
        "# HELP cloudpulse_active_replicas_total Total active pod replicas.",
        "# TYPE cloudpulse_active_replicas_total gauge",
        f"cloudpulse_active_replicas_total {overview['active_replicas']}",
        "# HELP cloudpulse_error_rate_ratio HTTP error rate ratio.",
        "# TYPE cloudpulse_error_rate_ratio gauge",
        f"cloudpulse_error_rate_ratio {overview['error_rate_percent'] / 100.0}"
    ]
    return Response(content="\n".join(lines) + "\n", media_type="text/plain; version=0.0.4")
