from fastapi import APIRouter
from app.services.shield_service import shield_service

router = APIRouter(prefix="/shield", tags=["Shield Protection"])

@router.get("/status")
async def get_shield_status():
    """Get active rate-limiting and mitigation enforcement status."""
    return shield_service.get_status()

@router.post("/toggle-enforcement")
async def toggle_shield_enforcement(enable: bool):
    """Enable or disable active rate-limiting enforcement."""
    shield_service.mitigation_enforced = enable
    return shield_service.get_status()
