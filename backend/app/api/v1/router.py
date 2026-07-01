"""Router raíz de la API v1."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, subjects, tutor

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(tutor.router)
api_router.include_router(subjects.router)
