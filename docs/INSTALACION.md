# Manual de instalación

## Requisitos

- Python 3.11+
- Node.js 20+
- Docker + Docker Compose
- PostgreSQL 16 (o vía Docker)

## Opción A — Todo con Docker (recomendado)

```bash
cp .env.example .env
# Edita .env: SECRET_KEY, AI_PROVIDER y la API key correspondiente
docker compose up --build
```

- Frontend: http://localhost
- API + Swagger: http://localhost:8000/docs
- MinIO console: http://localhost:9001

El contenedor del backend ejecuta migraciones y semilla automáticamente al arrancar.

## Opción B — Desarrollo local

### 1. Infraestructura

```bash
docker compose up -d db redis minio
```

### 2. Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell:  .venv\Scripts\Activate.ps1
# Git Bash:            source .venv/Scripts/activate
pip install -e ".[dev]"
alembic revision --autogenerate -m "esquema inicial"   # primera vez
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Usuario demo

Tras `python -m app.seed`:

- **Correo:** `estudiante@preu.pe`
- **Contraseña:** `estudiante123`

## Variables de entorno clave

| Variable | Descripción |
|----------|-------------|
| `SECRET_KEY` | Secreto JWT. **Obligatorio cambiar en producción.** |
| `AI_PROVIDER` | `anthropic` · `openai` · `gemini` · `echo` (demo sin key) |
| `AI_MODEL` | Modelo del proveedor (ej. `claude-opus-4-8`, `gpt-4o`) |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Credencial del proveedor elegido |
| `DATABASE_URL` | Opcional; si se omite se arma con las `POSTGRES_*` |

> Si no configuras una API key, la plataforma funciona igual en **modo demo**
> (`EchoProvider`), útil para probar el flujo end-to-end sin costos.

## Pruebas

```bash
cd backend
PYTHONPATH=. pytest -q
```
