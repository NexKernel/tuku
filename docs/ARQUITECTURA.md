# Arquitectura — PREU Mentor IA

## Principios

- **Arquitectura limpia + DDD**: dependencias apuntan siempre hacia el dominio.
- **Repository / Service Layer**: la API no habla con la base de datos directamente.
- **DTOs con Pydantic**: los modelos SQLAlchemy nunca cruzan la frontera HTTP.
- **Inyección de dependencias** vía el sistema `Depends` de FastAPI.
- **Proveedor de IA desacoplado**: la app depende de la interfaz `AIProvider`, no de un SDK.

## Capas del backend

```
app/
├── core/          Infraestructura: config, base de datos, seguridad (JWT, hashing)
├── domain/        Modelos SQLAlchemy 2.x, enums, base con UUID/timestamps/soft-delete
├── schemas/       DTOs Pydantic (entrada/salida de la API)
├── services/      Lógica de negocio
│   ├── ai/        Abstracción multi-proveedor (base, anthropic, openai, echo, factory)
│   ├── auth_service.py
│   └── tutor_service.py   ← orquesta la máquina de estados Socrática
└── api/
    ├── deps.py            Dependencias transversales (sesión, usuario actual, roles)
    └── v1/endpoints/      Routers por recurso
```

Regla de dependencia: `api → services → domain → core`. Los `schemas` son transversales.

## El motor Socrático (corazón del producto)

El tutor implementa una **máquina de estados de 15 pasos obligatorios**
(`TutorStep` en `domain/enums.py`). Cada `Conversation` guarda su `current_step`.

1. `TutorService.advance()` toma el paso actual.
2. `prompts.build_step_instruction()` inyecta la instrucción específica del paso
   (+ nivel de pista si aplica) sobre el `TUTOR_SYSTEM_PROMPT`.
3. El `AIProvider` genera la respuesta.
4. La máquina avanza — **excepto** en los pasos 7 (`socratic_questions`) y 8
   (`await_response`), donde el tutor se detiene a esperar al estudiante.

Así se garantiza el requisito pedagógico: **la IA nunca resuelve de inmediato**.

## Cambiar de proveedor de IA

Implementa la interfaz `AIProvider` (ver `services/ai/base.py`) y regístralo en
`services/ai/factory.py`. Config: `AI_PROVIDER` + la API key correspondiente.
Sin key válida, la fábrica cae a `EchoProvider` (modo demo ejecutable).

## Frontend

```
src/
├── lib/       api (axios + refresh automático), types, utils
├── store/     Zustand (auth persistido, tema)
├── hooks/     TanStack Query (useAuth, useTutor)
├── components/ Layout, MathMarkdown (KaTeX), StepIndicator, ThemeToggle
└── pages/     Login, Dashboard, Tutor (copiloto), Materias, Ranking
```

## Modelo de datos (Fase 1)

`users`, `student_profiles`, `subjects`, `topics`, `subtopics`, `questions`,
`conversations`, `messages`, `attempts`. Todas con UUID, `created_at`/`updated_at`
y `deleted_at` (soft delete). Enums nativos de PostgreSQL para roles, dificultad y pasos.
