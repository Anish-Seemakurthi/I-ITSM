from routers.auth import router as auth_router
from routers.incidents import router as incidents_router
from routers.technicians import router as technicians_router
from routers.services import router as services_router
from routers.sla import router as sla_router
from routers.reports import router as reports_router
from routers.admin import router as admin_router

__all__ = [
    "auth_router",
    "incidents_router",
    "technicians_router",
    "services_router",
    "sla_router",
    "reports_router",
    "admin_router",
]

