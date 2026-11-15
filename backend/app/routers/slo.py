from fastapi import APIRouter
from app.core.telemetry_state import telemetry_state

router = APIRouter(prefix="/slo", tags=["SLO"])

@router.get("")
async def get_slo_status():
    overview = telemetry_state.get_system_overview()
    
    # Calculate error budget consumption
    # Target: 99.9% uptime (budget: 0.1% = 43.2 minutes / month)
    error_rate = overview["error_rate_percent"]
    burn_rate = round(error_rate / 0.1, 2) if error_rate is not None else None
    latency = overview["p95_latency_ms"]
    cache_hit_ratio = overview["cache_hit_ratio_percent"]

    return {
        "slos": [
            {
                "id": "slo-availability",
                "name": "Global Service Availability (99.9%)",
                "target_percent": 99.90,
                "current_percent": None,
                "error_budget_remaining_percent": None,
                "burn_rate": burn_rate,
                "status": "unknown",
                "period": "Availability history is not persisted"
            },
            {
                "id": "slo-latency-p95",
                "name": "P95 Response Latency (< 100ms)",
                "target_ms": 100.0,
                "current_ms": latency,
                "status": (
                    "unknown" if latency is None
                    else "healthy" if latency < 100.0
                    else "critical"
                ),
                "period": "Measured request samples (5m window)"
            },
            {
                "id": "slo-cache-hit-ratio",
                "name": "Distributed Cache Hit Ratio (> 85%)",
                "target_percent": 85.0,
                "current_percent": cache_hit_ratio,
                "status": (
                    "unknown" if cache_hit_ratio is None
                    else "healthy" if cache_hit_ratio >= 85.0
                    else "warning"
                ),
                "period": "Current cache counters"
            }
        ]
    }
