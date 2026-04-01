from fastapi import APIRouter
from app.api import auth, users, reports, complaints, uploads, settings, notifications, surveys, departments, leaves

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(leaves.router, prefix="/leaves", tags=["leaves"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["complaints"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(surveys.router, prefix="/surveys", tags=["surveys"])
