from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.models import *  # registers all models with Base

from app.api.routes import (
    auth,
    cohorts,
    tasks,
    students,
    deployments,
    clients,
    analytics,
    payroll,
    leaves,
    notifications,
)

# Create all tables (including new leave_requests)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Antbox ERP",
    version="2.1.0",
    description="Role-based ERP — bootcamp, intern, and staff management",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,           prefix="/api/auth",          tags=["Auth"])
app.include_router(cohorts.router,        prefix="/api/cohorts",       tags=["Cohorts"])
app.include_router(tasks.router,          prefix="/api/tasks",         tags=["Tasks"])
app.include_router(students.router,       prefix="/api/students",      tags=["Students"])
app.include_router(deployments.router,    prefix="/api/deployments",   tags=["Deployments"])
app.include_router(clients.router,        prefix="/api/clients",       tags=["Clients"])
app.include_router(analytics.router,      prefix="/api/analytics",     tags=["Analytics"])
app.include_router(payroll.router,        prefix="/api/payroll",       tags=["Payroll"])
app.include_router(leaves.router,         prefix="/api/leaves",        tags=["Leaves"])
app.include_router(notifications.router,  prefix="/api/notifications", tags=["Notifications"])


@app.get("/")
def root():
    return {"status": "Antbox ERP v2.1 running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
