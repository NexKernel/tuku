# Tuku — atajos de desarrollo y despliegue
.DEFAULT_GOAL := help
.PHONY: help install install-back install-front infra migrate seed dev-back dev-front test build up down logs

help: ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: install-back install-front ## Instala backend y frontend

install-back: ## Instala dependencias del backend
	cd backend && python -m venv .venv && ./.venv/Scripts/python -m pip install -e ".[dev]"

install-front: ## Instala dependencias del frontend
	cd frontend && npm install

infra: ## Levanta Postgres, Redis y MinIO
	docker compose up -d db redis minio

migrate: ## Aplica migraciones Alembic
	cd backend && alembic upgrade head

seed: ## Carga datos semilla
	cd backend && python -m app.seed

dev-back: ## Backend en modo desarrollo
	cd backend && uvicorn app.main:app --reload

dev-front: ## Frontend en modo desarrollo
	cd frontend && npm run dev

test: ## Ejecuta las pruebas del backend
	cd backend && PYTHONPATH=. pytest -q

build: ## Compila el frontend para producción
	cd frontend && npm run build

up: ## Despliegue completo con Docker
	docker compose up --build -d

down: ## Detiene todos los servicios
	docker compose down

logs: ## Sigue los logs de todos los servicios
	docker compose logs -f
