from fastapi import APIRouter, HTTPException
from app.models.entities import ExperimentRunRequest
from app.services.experiment_runner import experiment_runner

router = APIRouter(prefix="/experiments", tags=["Experiments"])

@router.get("")
async def list_experiments():
    return experiment_runner.get_experiments()

@router.post("/run")
async def run_experiment(req: ExperimentRunRequest):
    try:
        return await experiment_runner.run_benchmark(
            name=req.name,
            duration=req.test_duration_seconds,
            vusers=req.virtual_users,
            pattern=req.pattern,
            intensity=req.intensity,
            max_requests=req.max_requests,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

@router.get("/{experiment_id}")
async def get_experiment(experiment_id: str):
    for exp in experiment_runner.get_experiments():
        if exp["id"] == experiment_id:
            return exp
    raise HTTPException(status_code=404, detail="Experiment not found")
