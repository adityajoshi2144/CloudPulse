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


@router.get("/verdict")
async def get_security_verdict():
    """Returns the primary CloudPulse Security Verdict for the Executive Dashboard."""
    full = risk_engine.calculate()
    return {
        "risk_level": full["risk_level"],
        "risk_score": full["risk_score"],
        "traffic_classification": full["traffic_classification"],
        "website_health": full["website_health"],
        "security_status": full["security_status"],
        "confidence": full["confidence_or_evidence_quality"],
        "detected_indicators": full["detected_indicators"],
        "explanation": full["explanation"],
        "recommended_action": full["recommended_action"],
        "mitigation_status": full["mitigation_status"],
        "simulation_mode": full["simulation_mode"],
        "assessed_at": full["assessed_at"],
        "last_analysis_time": full["last_analysis_time"],
    }


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
