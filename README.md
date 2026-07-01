# PREU Mentor IA

> Plataforma inteligente de entrenamiento académico para academias preuniversitarias del Perú.
> **No es un chatbot.** Es un tutor Socrático que desarrolla el razonamiento del estudiante.

[![Backend](https://img.shields.io/badge/backend-FastAPI-009688)]()
[![Frontend](https://img.shields.io/badge/frontend-React_19-61dafb)]()
[![License](https://img.shields.io/badge/license-Propietaria-black)]()

---

## Visión

PREU Mentor IA es una plataforma premium de tutoría con IA. El principio pedagógico central:
**la IA nunca resuelve de inmediato**. Guía mediante preguntas socráticas, detecta debilidades
y se adapta a cada estudiante, imitando a un profesor experto de academia.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 · Vite · TypeScript · TailwindCSS · shadcn/ui · Framer Motion · TanStack Query · Zustand |
| Backend | Python 3.11 · FastAPI · SQLAlchemy 2 · Alembic · Pydantic v2 |
| Datos | PostgreSQL · Redis · MinIO (S3) |
| IA | Abstracción multi-proveedor (Anthropic · OpenAI · Gemini) + RAG |
| Infra | Docker · Nginx · Dokploy |

## Arquitectura

Arquitectura limpia + DDD. Cada capa depende solo de la interior:

```
api  →  services  →  domain (models + repositories)  →  core (infra)
        ▲ schemas (DTOs Pydantic) cruzan capas
```

Ver [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) y [`docs/INSTALACION.md`](docs/INSTALACION.md).

## Estado del proyecto (roadmap)

Este repositorio se construye por fases. La **Fase 1** entrega una base ejecutable:

- [x] Arquitectura limpia backend (core, domain, services, api)
- [x] Modelos de datos con UUID, timestamps, soft-delete
- [x] Autenticación JWT + Refresh Token
- [x] Motor Socrático de 15 pasos (máquina de estados del tutor)
- [x] Abstracción de proveedor de IA (Anthropic por defecto)
- [x] Frontend: shell premium, Dashboard y Chat copiloto
- [x] Docker Compose + Nginx listo para Dokploy
- [ ] Fase 2: RAG, OCR, banco de preguntas, importadores
- [ ] Fase 3: Gamificación, paneles docente/admin, reportes, WebSockets

## Arranque rápido

```bash
cp .env.example .env          # revisa las variables
docker compose up -d db redis # infraestructura
# Backend
cd backend && python -m venv .venv && . .venv/Scripts/activate
pip install -e ".[dev]"
alembic upgrade head
python -m app.seed            # datos semilla
uvicorn app.main:app --reload
# Frontend
cd frontend && npm install && npm run dev
```

- API + Swagger: http://localhost:8000/docs
- Frontend: http://localhost:5173

Todo en Docker: `docker compose up --build`.
