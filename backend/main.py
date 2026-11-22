"""
I-ITSM: Intelligent IT Service Management & Incident Resolution System
FastAPI Main Application Entrypoint
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from database import engine, Base, SessionLocal
import models  # Ensures all models are registered in SQLAlchemy metadata
from utils.seed_data import seed_database
from services.sla_service import SLAService
from patterns.state import InvalidStateTransitionError

# Routers
from routers import (
    auth_router,
    incidents_router,
    technicians_router,
    services_router,
    sla_router,
    reports_router,
    admin_router,
)


# Background task for continuous SLA monitoring
async def continuous_sla_monitor():
    while True:
        try:
            await asyncio.sleep(60)  # Check every 60 seconds
            db = SessionLocal()
            try:
                SLAService.check_sla_violations(db)
            finally:
                db.close()
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[SLA Monitor Error]: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Tables & Seed Initial Data
    print("Initializing Database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        print("Database seeded successfully with default users, IT services, and SLA policies.")
    finally:
        db.close()

    # Start background SLA monitoring task
    monitor_task = asyncio.create_task(continuous_sla_monitor())
    yield
    # Shutdown
    monitor_task.cancel()


app = FastAPI(
    title="Intelligent IT Service Management (I-ITSM) API",
    description="Enterprise Incident Management & Resolution System with OOP Design Patterns and AI-Powered Automation.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for Frontend Development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(incidents_router)
app.include_router(technicians_router)
app.include_router(services_router)
app.include_router(sla_router)
app.include_router(reports_router)
app.include_router(admin_router)


# Exception Handlers
@app.exception_handler(InvalidStateTransitionError)
async def invalid_state_transition_handler(request: Request, exc: InvalidStateTransitionError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc), "error_type": "InvalidStateTransitionError"},
    )


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "I-ITSM Backend"}


@app.get("/")
def root():
    return {
        "title": "Intelligent IT Service Management & Incident Resolution System (I-ITSM)",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "status": "operational",
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

