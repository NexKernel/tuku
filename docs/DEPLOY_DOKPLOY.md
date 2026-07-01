# Despliegue en Dokploy

Guía para desplegar PREU Mentor IA en Dokploy usando el **PostgreSQL que ya creaste**.

## 1. Requisitos previos

- Un servidor con Dokploy instalado.
- El servicio PostgreSQL creado en Dokploy (ya lo tienes: base `socratico`).
- El repositorio en GitHub: `https://github.com/pckernelsac/mentor`.

## 2. Crear el stack (Docker Compose)

1. En Dokploy: **Create → Compose**.
2. Provider: **GitHub**, repositorio `pckernelsac/mentor`, rama `main`.
3. **Compose Path:** `docker-compose.dokploy.yml`.

> Este compose **no** crea una base de datos: se conecta a la tuya vía `DATABASE_URL`
> y se une a `dokploy-network`, la red donde vive tu PostgreSQL.

## 3. Variables de entorno (pestaña *Environment*)

Pega estas variables. **Nunca** se guardan en el repositorio, solo aquí:

```env
# Base de datos (tu cadena de Dokploy). El backend fuerza el driver async automáticamente.
DATABASE_URL=postgresql://socratico_user:TU_PASSWORD@socratico-postgresql-2nxoxb:5432/socratico

# Seguridad — genera uno nuevo (ver abajo)
SECRET_KEY=pon_un_secreto_largo_y_aleatorio

# Dominio (UN solo dominio: el frontend hace proxy /api → backend, sin CORS)
BACKEND_CORS_ORIGINS=https://mentor.tudominio.com
VITE_API_URL=/api/v1

# IA
AI_PROVIDER=openai
AI_MODEL=gpt-4o
OPENAI_API_KEY=sk-...tu_clave_nueva...
```

Generar un `SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

> ⚠️ La clave de OpenAI que compartiste antes quedó expuesta: **revócala y crea una nueva**
> en https://platform.openai.com/api-keys antes de usarla aquí.

## 4. Dominios (pestaña *Domains*)

Solo necesitas **un dominio**, apuntando al frontend. El frontend (Nginx) reenvía
`/api` al backend por la red interna, así que **no** expones el backend ni hay CORS.

| Servicio | Puerto | Dominio |
|----------|--------|---------|
| `socratico-frontend` | 80 | `mentor.tudominio.com` |

Dokploy (Traefik) gestiona el TLS automáticamente (Let's Encrypt).

- App: `https://mentor.tudominio.com`
- API bajo el mismo dominio: `https://mentor.tudominio.com/api/v1/...`
- Swagger: `https://mentor.tudominio.com/docs`

> `VITE_API_URL=/api/v1` (ruta relativa) ya viene por defecto: mismo origen, sin CORS.
> No necesitas un dominio aparte para el backend.

## 5. Desplegar

Pulsa **Deploy**. En el arranque, el backend ejecuta automáticamente:

```
alembic upgrade head   →  crea las tablas
python -m app.seed     →  materias + usuario demo
uvicorn app.main:app   →  API en :8000
```

## 6. Verificación

- App: `https://mentor.tudominio.com`
- API: `https://mentor.tudominio.com/health` → `{"status":"ok"}`
- Swagger: `https://mentor.tudominio.com/docs`
- Login demo: `estudiante@preu.pe` / `estudiante123` (cámbialo/elimínalo en producción).

## 7. Notas de red

El backend alcanza tu PostgreSQL por el hostname del servicio Dokploy
(`socratico-postgresql-2nxoxb`) porque ambos comparten `dokploy-network`.
Si el nombre del host cambia, actualiza `DATABASE_URL`.

## Alternativa: dos Aplicaciones separadas

Si prefieres no usar Compose, crea dos **Applications** en Dokploy (usa nombres
propios como `socratico-backend` y `socratico-frontend` para no colisionar):

- **socratico-backend** → build context `backend/` (Dockerfile). Variables: las del backend de arriba.
- **socratico-frontend** → build context `frontend/` (Dockerfile), build arg `VITE_API_URL`.

Ambas deben unirse a `dokploy-network` para ver el PostgreSQL.
