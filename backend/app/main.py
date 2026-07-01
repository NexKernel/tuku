"""Punto de entrada de la aplicación FastAPI."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    logging.getLogger("app").info(
        "Iniciando %s (%s) — proveedor IA: %s",
        settings.APP_NAME,
        settings.ENVIRONMENT,
        settings.AI_PROVIDER,
    )
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="Tutor Socrático inteligente para academias preuniversitarias.",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Sistema"])
async def health() -> dict[str, str]:
    return {"status": "ok", "app": settings.APP_NAME, "environment": settings.ENVIRONMENT}
