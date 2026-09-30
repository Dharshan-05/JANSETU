from fastapi import APIRouter
from app.api.v1.intake import router as intake_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.hotspots import router as hotspots_router
from app.api.v1.silent_need import router as silent_need_router
from app.api.v1.digital_twin import router as digital_twin_router
from app.api.v1.evidence import router as evidence_router
from app.api.v1.sandbox import router as sandbox_router
from app.api.v1.impact import router as impact_router
from app.api.v1.data import data_router
from app.api.v1.ai import router as ai_router

api_v1_router = APIRouter()

@api_v1_router.get("", tags=["API v1"])
@api_v1_router.get("/version", tags=["API v1"])
async def get_api_v1_version():
    """Identifies the API v1 namespace and registered modules."""
    return {
        "version": "v1",
        "status": "active",
        "phase": "PHASE 1 - FOUNDATION | PHASE 2 - DATA ENGINEERING | PHASE 3 - MULTILINGUAL INTAKE | PHASE 4 - AI PERCEPTION",
        "modules": [
            "data",
            "intake",
            "ai",
            "analytics",
            "hotspots",
            "silent-need",
            "digital-twin",
            "evidence",
            "sandbox",
            "impact"
        ]
    }

api_v1_router.include_router(data_router)
api_v1_router.include_router(intake_router)
api_v1_router.include_router(ai_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(hotspots_router)
api_v1_router.include_router(silent_need_router)
api_v1_router.include_router(digital_twin_router)
api_v1_router.include_router(evidence_router)
api_v1_router.include_router(sandbox_router)
api_v1_router.include_router(impact_router)

