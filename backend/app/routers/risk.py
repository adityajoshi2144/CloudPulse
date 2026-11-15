from typing import Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.risk_engine import risk_engine

router = APIRouter(prefix="/risk", tags=["Risk Analysis"])


class RiskConfigUpdate(BaseModel):
    weights: Dict[str, float] = Field(...)
    thresholds: Dict[str, Dict[str, float]] = Field(...)
    classification_thresholds: Dict[str, int] = Field(...)


@router.get("")
async def get_risk_analysis():
    return risk_engine.calculate()


@router.get("/config")
async def get_risk_configuration():
    return risk_engine.get_config()


@router.put("/config")
async def update_risk_configuration(config: RiskConfigUpdate):
    try:
        return risk_engine.update_config(
            config.weights,
            config.thresholds,
            config.classification_thresholds,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
