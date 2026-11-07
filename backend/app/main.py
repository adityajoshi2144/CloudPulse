import asyncio
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db
from app.core.cache import cache_service
from app.core.telemetry_state import telemetry_state
from app.services.autoscaler import autoscaler_service
from app.services.simulator_engine import simulator_engine

from app.routers import (
    health,
    metrics,
    services,
    scaling,
    simulator,
    incidents,
    alerts,
    cache,
    experiments,
    audit,
    slo
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("cloudpulse")

# WebSocket active client pool
active_websockets: list[WebSocket] = []

async def telemetry_background_loop():
    """Evolves cluster metrics every 1s and broadcasts to WebSocket clients."""
    while True:
        try:
            # 1. Update telemetry physics & simulation
            telemetry_state.update_tick()
            simulator_engine.tick()

            # 2. Evaluate Kubernetes / CloudPulse HPA policies
            autoscaler_service.evaluate_hpa()

            # 3. Broadcast to WebSockets if any clients connected
            if active_websockets:
                payload = json.dumps({
                    "type": "TELEMETRY_UPDATE",
                    "overview": telemetry_state.get_system_overview(),
                    "services": list(telemetry_state.services.values()),
                    "simulator": simulator_engine.get_status()
                })
                # Broadcast concurrently
                dead_sockets = []
                for ws in active_websockets:
                    try:
                        await ws.send_text(payload)
                    except Exception:
                        dead_sockets.append(ws)
                for ds in dead_sockets:
                    if ds in active_websockets:
                        active_websockets.remove(ds)
        except Exception as e:
            logger.error("Error in telemetry loop: %s", str(e), exc_info=True)
        
        await asyncio.sleep(1.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting CloudPulse Platform v%s (%s)", settings.VERSION, settings.ENVIRONMENT)
    await init_db()
    await cache_service.init()
    
    # Launch background loop
    loop_task = asyncio.create_task(telemetry_background_loop())
    yield
    # Shutdown
    loop_task.cancel()
    logger.info("CloudPulse shutdown complete")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Cloud Operations, Autonomous Auto-Scaling, and Telemetry Platform",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(metrics.router, prefix=settings.API_V1_STR)
app.include_router(services.router, prefix=settings.API_V1_STR)
app.include_router(scaling.router, prefix=settings.API_V1_STR)
app.include_router(simulator.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(cache.router, prefix=settings.API_V1_STR)
app.include_router(experiments.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(slo.router, prefix=settings.API_V1_STR)

# Also expose standard /metrics endpoint for Prometheus scrapers
app.include_router(metrics.router, prefix="")

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    # Send immediate state on connection
    try:
        initial_payload = json.dumps({
            "type": "INITIAL_STATE",
            "overview": telemetry_state.get_system_overview(),
            "services": list(telemetry_state.services.values()),
            "simulator": simulator_engine.get_status()
        })
        await websocket.send_text(initial_payload)
        while True:
            # Keep socket alive and handle any incoming client messages (e.g. ping)
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if websocket in active_websockets:
            active_websockets.remove(websocket)

@app.get("/")
async def root():
    return {
        "name": "CloudPulse API",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "api_v1": settings.API_V1_STR,
        "status": "operational"
    }
