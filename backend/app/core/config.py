"""Configuración central. Se carga una sola vez y se inyecta vía `get_settings`."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # App
    APP_NAME: str = "Tuku"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173"

    # Seguridad
    SECRET_KEY: str = "insecure-dev-key-change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # PostgreSQL
    POSTGRES_USER: str = "preu"
    POSTGRES_PASSWORD: str = "preu_dev_password"
    POSTGRES_DB: str = "preu_mentor"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str | None = None
    # Pool POR PROCESO: conexiones máximas = WEB_CONCURRENCY × (POOL_SIZE + MAX_OVERFLOW).
    # Con 4 workers × (10 + 5) = 60, por debajo del max_connections=100 de Postgres.
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 5
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    # Crear el usuario demo (contraseña pública) al sembrar. Desactivar en producción.
    SEED_DEMO_USER: bool = True

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Límites de uso (por ventana de 60 s, en Redis). Si Redis cae, no se bloquea a nadie.
    RATE_LIMIT_ENABLED: bool = True
    # Por correo: frena fuerza bruta sin castigar a un aula entera detrás de la misma IP.
    RATE_LIMIT_LOGIN_PER_MIN: int = 10
    # Por niño: turnos del tutor (cada uno es una llamada a la IA).
    RATE_LIMIT_TUTOR_PER_MIN: int = 20

    # IA
    AI_PROVIDER: Literal["anthropic", "openai", "deepseek", "gemini", "echo"] = "anthropic"
    AI_MODEL: str = "claude-opus-4-8"
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    GEMINI_API_KEY: str = ""
    # Llamadas simultáneas a la IA por proceso. Por debajo del pool de BD: cada turno
    # mantiene su sesión abierta mientras espera a la IA.
    AI_MAX_CONCURRENCY: int = 12
    # Segundos que un turno espera un hueco libre antes de responder "Tuku está ocupado".
    AI_QUEUE_TIMEOUT: float = 30.0
    AI_REQUEST_TIMEOUT: float = 60.0
    AI_MAX_RETRIES: int = 2

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sqlalchemy_dsn(self) -> str:
        if self.DATABASE_URL:
            # Acepta URLs estándar (postgresql:// o postgres://) y fuerza el driver async.
            url = self.DATABASE_URL
            for prefix in ("postgresql+asyncpg://", "postgresql://", "postgres://"):
                if url.startswith(prefix):
                    return "postgresql+asyncpg://" + url[len(prefix):]
            return url
        return str(
            PostgresDsn.build(
                scheme="postgresql+asyncpg",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_HOST,
                port=self.POSTGRES_PORT,
                path=self.POSTGRES_DB,
            )
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
