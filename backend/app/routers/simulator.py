from fastapi import APIRouter, HTTPException
from app.models.entities import SimulatorConfig
from app.services.simulator_engine import simulator_engine
from app.services.shield_service import shield_service

router = APIRouter(prefix="/simulator", tags=["TrafficSimulator"])

@router.get("/status")
async def get_simulator_status():
    return simulator_engine.get_status()

@router.post("/start")
async def start_simulator(config: SimulatorConfig):
    try:
        return simulator_engine.start(config)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

@router.post("/pause")
async def pause_simulator():
    return simulator_engine.pause()

@router.post("/resume")
async def resume_simulator():
    return simulator_engine.resume()

@router.post("/stop")
async def stop_simulator():
    return await simulator_engine.stop()

@router.get("/limits")
async def get_simulation_limits():
    return {
        "target": "CloudPulse local test service only",
        "max_concurrency": simulator_engine.MAX_CONCURRENCY,
        "max_requests_per_run": simulator_engine.MAX_REQUESTS_PER_RUN,
        "max_requests_per_second": simulator_engine.MAX_REQUESTS_PER_SECOND,
        "max_duration_seconds": 60,
        "external_targets_allowed": False,
    }

@router.get("/test-target")
async def local_test_target():
    if simulator_engine.test_service_failed:
        raise HTTPException(
            status_code=503,
            detail="The isolated CloudPulse test endpoint is in failure simulation mode.",
        )
    is_allowed, reason = shield_service.check_request(client_ip="127.0.0.1", path="/api/simulator/test-target")
    if not is_allowed:
        raise HTTPException(status_code=429, detail=reason)
    return {"status": "ok", "target": "cloudpulse-test-service"}
