"""
Finance Package Router
Aggregates all finance sub-routers: billings, payroll, etc.
"""
from fastapi import APIRouter
from app.routers.finance import billings

router = APIRouter()

# Include all sub-routers
router.include_router(billings.router)
