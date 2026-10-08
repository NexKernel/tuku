# ── Backend FastAPI ───────────────────────────────────────────
FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dependencias del sistema mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
    && rm -rf /var/lib/apt/lists/*

# Código + instalación del paquete (incluye dependencias del pyproject)
COPY . .
RUN pip install --upgrade pip && pip install .

# Procesos de Uvicorn. Regla práctica: 2 × núcleos de CPU del contenedor.
# Ojo: cada proceso abre su propio pool de BD (ver DB_POOL_SIZE en config.py).
ENV WEB_CONCURRENCY=4

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

# Migra y siembra UNA vez y luego arranca los workers (exec: recibe SIGTERM y cierra limpio).
CMD ["sh", "-c", "alembic upgrade head && python -m app.seed && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${WEB_CONCURRENCY} --proxy-headers --forwarded-allow-ips '*' --timeout-keep-alive 30"]
