from fastapi import APIRouter, HTTPException
from app.services.demo_engine import demo_engine

router = APIRouter(prefix="/demo", tags=["Faculty Demonstration"])

@router.get("/status")
async def get_demo_status():
    """Get the current live state of the Faculty Demonstration."""
    return demo_engine.get_status()

@router.post("/start")
async def start_faculty_demo():
    """Start the guided 7-stage Faculty Demonstration."""
    try:
        return demo_engine.start()
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

@router.post("/pause")
async def pause_faculty_demo():
    """Pause the running demonstration."""
    return demo_engine.pause()

@router.post("/resume")
async def resume_faculty_demo():
    """Resume the paused demonstration."""
    return demo_engine.resume()

@router.post("/stop")
async def stop_faculty_demo():
    """Stop the demonstration immediately."""
    return await demo_engine.stop()

@router.post("/reset")
async def reset_faculty_demo():
    """Reset the demonstration and cluster back to clean nominal baseline."""
    return await demo_engine.reset()

@router.post("/step/{stage}")
async def run_demo_step(stage: int):
    """Run a specific single demonstration stage."""
    try:
        return await demo_engine.run_single_step(stage)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.get("/report")
async def get_faculty_demo_report():
    """Get the final compiled demonstration report."""
    report = demo_engine.get_report()
    if not report:
        return {
            "available": False,
            "status": "not_started",
            "message": "No demonstration report available yet. Run the demonstration first.",
            "report": None,
        }
    return report
