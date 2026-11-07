from fastapi import APIRouter
from app.core.telemetry_state import telemetry_state

router = APIRouter(prefix="/slo", tags=["SLO"])

@router.get("")
async def get_slo_status():
    overview = telemetry_state.get_system_overview()
    
    # Calculate error budget consumption
    # Target: 99.9% uptime (budget: 0.1% = 43.2 minutes / month)
    error_rate = overview["error_rate_percent"]
    burn_rate = round(max(0.1, (error_rate / 0.1)), 2)
    
    return {
        "slos": [
            {
                "id": "slo-availability",
                "name": "Global Service Availability (99.9%)",
                "target_percent": 99.90,
                "current_percent": overview["uptime_percent"],
                "error_budget_remaining_percent": round(max(0.0, 100.0 - (burn_rate * 4.2)), 1),
                "burn_rate": burn_rate,
                "status": "healthy" if burn_rate < 1.5 else ("warning" if burn_rate < 3.0 else "critical"),
                "period": "30d rolling"
            },
            {
                "id": "slo-latency-p95",
                "name": "P95 Response Latency (< 100ms)",
                "target_ms": 100.0,
                "current_ms": overview["p95_latency_ms"],
                "compliance_percent": 99.4,
                "status": "healthy" if overview["p95_latency_ms"] < 60.0 else ("warning" if overview["p95_latency_ms"] < 100.0 else "critical"),
                "period": "30d rolling"
            },
            {
                "id": "slo-cache-hit-ratio",
                "name": "Distributed Cache Hit Ratio (> 85%)",
                "target_percent": 85.0,
                "current_percent": overview["cache_hit_ratio_percent"],
                "compliance_percent": 99.8,
                "status": "healthy" if overview["cache_hit_ratio_percent"] >= 85.0 else "warning",
                "period": "30d rolling"
            }
        ]
    }
