from fastapi import APIRouter
from app.models.entities import SimulatorConfig
from app.services.simulator_engine import simulator_engine

router = APIRouter(prefix="/simulator", tags=["TrafficSimulator"])

@router.get("/status")
async def get_simulator_status():
    return simulator_engine.get_status()

@router.post("/start")
async def start_simulator(config: SimulatorConfig):
    return simulator_engine.start(config)

@router.post("/pause")
async def pause_simulator():
    return simulator_engine.pause()

@router.post("/resume")
async def resume_simulator():
    return simulator_engine.resume()

@router.post("/stop")
async def stop_simulator():
    return simulator_engine.stop()
