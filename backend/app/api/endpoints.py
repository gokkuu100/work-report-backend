from fastapi import APIRouter
from app.api import auth, users, reports, complaints, uploads, settings

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["complaints"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
