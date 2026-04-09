"""
API routes — aggregates all FastAPI routers into a single one
for the FastAPI app to include.
"""

from fastapi import APIRouter

from pipeline.api.routes import analyze, cashflow, classify, system, whatif

router = APIRouter()
router.include_router(system.router)
router.include_router(classify.router)
router.include_router(analyze.router)
router.include_router(cashflow.router)
router.include_router(whatif.router)

__all__ = ["router"]
