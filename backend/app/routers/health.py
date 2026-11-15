import logging
import time
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.core.cache import cache_service
from app.core.database import engine
from app.core.metrics_collector import metrics_collector

router = APIRouter(prefix="/health", tags=["Health"])
logger = logging.getLogger("cloudpulse.health")

@router.get("")
async def get_health():
    database_started = time.perf_counter()
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        database_latency_ms = round((time.perf_counter() - database_started) * 1000, 2)
        metrics_collector.record_database_probe(database_latency_ms)
        database_check = {
            "status": "connected",
            "engine": "PostgreSQL" if "postgresql" in settings.DATABASE_URL else "SQLite",
            "latency_ms": database_latency_ms,
        }
    except Exception as exc:
        logger.exception("Database health check failed")
        database_check = {
            "status": "unavailable",
            "engine": "PostgreSQL" if "postgresql" in settings.DATABASE_URL else "SQLite",
            "error": str(exc),
        }

    cache_stats = await cache_service.get_stats()
    cache_check = {
        "status": "connected" if cache_stats["is_real_redis"] else "fallback",
        "engine": cache_stats["engine"],
        "hit_ratio_percent": cache_stats["hit_ratio_percent"],
        "details": (
            "Redis is connected."
            if cache_stats["is_real_redis"]
            else "Redis is unavailable; using process-local in-memory cache."
        ),
    }

    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            response = await client.get(f"{settings.PROMETHEUS_URL.rstrip('/')}/-/ready")
            response.raise_for_status()
        prometheus_check = {"status": "connected", "url": settings.PROMETHEUS_URL}
    except (httpx.HTTPError, ValueError) as exc:
        logger.info("Prometheus health check unavailable: %s", exc)
        prometheus_check = {
            "status": "unavailable",
            "url": settings.PROMETHEUS_URL,
            "error": str(exc),
        }

    kubernetes_check = (
        {
            "status": "not_integrated",
            "details": "Kubernetes is configured, but no Kubernetes API client is implemented.",
        }
        if settings.KUBERNETES_ENABLED
        else {
            "status": "disabled",
            "details": "Kubernetes is disabled; replica and service operations are unavailable.",
        }
    )
    database_available = database_check["status"] == "connected"

    return {
        "status": "healthy" if database_available else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "data_mode": "in_process_simulation",
        "operational_state_persistent": False,
        "checks": {
            "database": database_check,
            "cache": cache_check,
            "prometheus": prometheus_check,
            "orchestration": kubernetes_check,
            "model": {
                "status": "not_implemented",
                "details": "No trained or validated risk model is configured.",
            },
            "frontend": {
                "status": "not_probed",
                "details": "Frontend availability must be checked by the browser.",
            },
            "operational_state": {
                "status": "process_local",
                "details": "Telemetry, incidents, and scaling events are not persisted to the database.",
            },
        },
    }
