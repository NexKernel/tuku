# Manual del desarrollador

## Flujo de trabajo

1. Modela en `domain/models/` → registra en `domain/models/__init__.py`.
2. Genera migración: `alembic revision --autogenerate -m "..."` y revísala.
3. DTOs en `schemas/`. Lógica en `services/`. Endpoint en `api/v1/endpoints/`.
4. Registra el router en `api/v1/router.py`.
5. Pruebas en `tests/`.

## Convenciones

- **Tipado estricto** (mypy `strict`), Ruff para lint/orden de imports.
- SQLAlchemy 2.x con `Mapped[...]` y `mapped_column`.
- Async en todo el stack de datos (asyncpg, sesiones async).
- Los modelos **nunca** se serializan directo: usa `Schema.model_validate(obj)`.

## Añadir un módulo nuevo (ejemplo: banco de preguntas)

1. `domain/models/academic.py` ya tiene `Question`.
2. Crea `schemas/question.py` y `services/question_service.py`.
3. `api/v1/endpoints/questions.py` con CRUD + import (Excel/Word/PDF/JSON).
4. Para la clasificación automática por IA, reutiliza `build_ai_provider()`.

## Añadir un proveedor de IA

```python
# services/ai/gemini_provider.py
class GeminiProvider:
    model: str
    async def complete(self, *, system, messages, max_tokens=1024, temperature=0.4): ...
```

Regístralo en `services/ai/factory.py`. Implementa el `Protocol` `AIProvider`.

## Extender el flujo del tutor

Los 15 pasos viven en `domain/enums.py::TutorStep` y sus instrucciones en
`services/ai/prompts.py::STEP_INSTRUCTIONS`. Para cambiar el comportamiento
pedagógico, edita ahí — no toques la lógica de la máquina de estados.

## Roadmap técnico (fases siguientes)

- **RAG**: colección + embeddings (pgvector), ingesta de PDF/Word/Excel, citas de fuente.
- **OCR**: subida de imágenes → reconocimiento de texto matemático.
- **WebSockets**: streaming de la respuesta del tutor token a token.
- **Gamificación**: motor de XP/insignias/misiones sobre `Attempt` y `StudentProfile`.
- **Paneles docente/admin**: gestión multiacademia (tablas `academies`, `sedes`, `licenses`).
- **Reportes**: exportación PDF/Excel/CSV.
