# Despliegue en Dokploy — tuku.ose.lat

Guía para desplegar Tuku en un Dokploy **compartido con otros proyectos**.

- **Repositorio:** `https://github.com/NexKernel/tuku.git` (rama `main`)
- **Dominio:** `https://tuku.ose.lat`
- **Compose:** `docker-compose.dokploy.yml`

Todo lleva el prefijo **`tuku-`** (servicios `tuku-backend`, `tuku-frontend`, `tuku-redis`,
red `tuku-internal`, routers Traefik `tuku-frontend*`). En `dokploy-network` el DNS de Docker
resuelve por nombre en TODOS los stacks: un servicio llamado igual que otro haría que nuestro
nginx le hable al backend de otra app. No renombres sin mantener el prefijo.

## 1. Requisitos previos

1. **DNS:** registro `A` de `tuku.ose.lat` → IP pública del servidor Dokploy
   (compruébalo con `nslookup tuku.ose.lat`). Sin esto Let's Encrypt no emite el certificado.
2. **PostgreSQL** creado como servicio en Dokploy (*Create → Database → PostgreSQL*), por
   ejemplo `tuku-postgresql`. Anota su **Internal Host**, usuario, contraseña y base.
3. Acceso de Dokploy al repo: si `NexKernel/tuku` es privado, conecta la GitHub App de
   Dokploy a la organización NexKernel (*Settings → Git*).

## 2. Crear el stack (Docker Compose)

1. En Dokploy: **Create → Compose** (nombre sugerido: `tuku`).
2. Provider **GitHub** → repositorio `NexKernel/tuku`, rama `main`.
3. **Compose Path:** `./docker-compose.dokploy.yml`.

El compose **no** crea base de datos ni publica puertos: usa tu Postgres vía `DATABASE_URL`
(por `dokploy-network`) y Traefik enruta el dominio con las labels del propio compose.

## 3. Variables de entorno (pestaña *Environment*)

Los valores reales viven **solo aquí**, nunca en el repositorio:

```env
# Obligatorias (el deploy falla si faltan)
DATABASE_URL=postgresql://USUARIO:PASSWORD@INTERNAL_HOST_POSTGRES:5432/BASE
SECRET_KEY=pega_aqui_un_secreto_largo

# IA
AI_PROVIDER=deepseek
AI_MODEL=deepseek-chat
DEEPSEEK_API_KEY=sk-...

# Opcional: usuario demo estudiante@preu.pe / estudiante123 (contraseña pública).
# Déjalo en false en producción.
SEED_DEMO_USER=false
```

Generar `SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

El resto (CORS, capacidad, límites) ya tiene valores por defecto para `tuku.ose.lat`; la
lista completa está en `.env.production.example`.

## 4. Dominio

**No uses la pestaña *Domains*:** el dominio y el certificado los declaran las labels de
`tuku-frontend` en el compose (HTTPS con Let's Encrypt + redirección de HTTP a HTTPS).
Si además lo agregas en *Domains*, Traefik tendría dos routers para el mismo host.

El frontend (nginx) reenvía `/api`, `/health` y `/docs` a `tuku-backend` por la red interna:
un solo dominio, sin CORS y sin exponer el backend.

## 5. Desplegar

Pulsa **Deploy** y revisa el log:

1. **Clone:** confirma que trae el último commit de `main`.
2. **Build:** si todo sale `CACHED` habiendo código nuevo, el clone no se actualizó.
3. **Arranque del backend:** `alembic upgrade head` → `python -m app.seed` → 4 workers de
   Uvicorn. El frontend espera a que el backend esté *healthy*.

## 6. Verificación (sin fiarse de la UI)

```bash
curl -sI https://tuku.ose.lat | head -1                     # HTTP/2 200 y certificado válido
curl -s  https://tuku.ose.lat/health                        # {"status":"ok","app":"Tuku",...}
# Ruta exclusiva de Tuku: confirma que el proxy llega a NUESTRO backend (401 = correcto)
curl -s -o /dev/null -w '%{http_code}
' https://tuku.ose.lat/api/v1/tutor/conversations
```

Luego entra a `https://tuku.ose.lat`, regístrate y empieza un reto.

## 7. Problemas frecuentes

- **Sirve código viejo:** el clone vive en `/etc/dokploy/compose/<app>/code`. Por SSH:
  `sudo git -C <dir> log -1 --oneline`; si está atrasado,
  `sudo git -C <dir> fetch origin && sudo git -C <dir> reset --hard origin/main` y redeploy.
- **404 o responde otra app:** busca quién más declara el host o usa nombres genéricos:
  `sudo docker ps --format '{{.Names}}'` (no debe haber otro `tuku-backend`).
- **Certificado no se emite:** el DNS aún no apunta al servidor, o el puerto 80 está cerrado.
- **El backend no arranca (unhealthy):** casi siempre `DATABASE_URL` (host interno, usuario
  o contraseña). Míralo en los logs de `tuku-backend`.

## 8. Panel de superadmin (`/admin`)

Solo para las cuentas de `SUPERADMIN_EMAIL`; nadie puede darse ese rol desde la app.

1. Regístrate en `https://tuku.ose.lat` con tu correo.
2. En Dokploy → Environment: `SUPERADMIN_EMAIL=tu@correo.com` → **Deploy**.
3. Al arrancar, el log muestra `[OK] Superadmin: tu@correo.com`. Vuelve a entrar y verás
   **Admin** en el menú.

El panel muestra registros (total, hoy, 7 días, por día), tokens de IA consumidos (entrada,
salida, por día y por usuario) y permite habilitar/desactivar cuentas una a una, por
selección o todas a la vez. Con **Aprobar registros nuevos** activo, las cuentas nacen
desactivadas hasta que las habilites. Desactivar a alguien lo saca al instante, aunque
tenga la sesión abierta. Los días se cuentan en hora de Lima.

## 9. Alta demanda (muchos niños el mismo día)

El backend arranca con **4 procesos** de Uvicorn y está preparado para picos de uso, como
un colegio entero que entra a la misma hora:

| Capa | Qué hace | Variable |
|---|---|---|
| Procesos | Varios workers de Uvicorn (≈ 2 × núcleos de CPU) | `WEB_CONCURRENCY` |
| Login | bcrypt corre en un hilo: 30 logins a la vez no congelan el servidor | — |
| Base de datos | Pool por proceso; total = `WEB_CONCURRENCY × (POOL_SIZE + OVERFLOW)` | `DB_POOL_SIZE`, `DB_MAX_OVERFLOW` |
| IA | Cliente reutilizado, timeout, reintentos ante 429/5xx y **cola** con tope de llamadas simultáneas | `AI_MAX_CONCURRENCY`, `AI_QUEUE_TIMEOUT`, `AI_REQUEST_TIMEOUT` |
| Saturación | Si la cola de IA se llena, el niño ve «Tuku está atendiendo a muchos niños…» (503) y puede reenviar su mensaje; no se pierde nada | — |
| Abuso | Límite por minuto en Redis: login **por correo** (no por IP, un aula comparte IP) y turnos de tutor **por niño** | `RATE_LIMIT_LOGIN_PER_MIN`, `RATE_LIMIT_TUTOR_PER_MIN` |

**Cómo dimensionar**

- Cada turno del tutor dura lo que tarda la IA (3–10 s). Con los valores por defecto hay
  `4 × 12 = 48` turnos en paralelo → unos 5–15 turnos/s, suficiente para miles de niños
  repartidos en el día o varios cientos conectados a la vez.
- Para más capacidad: sube `WEB_CONCURRENCY` (si hay CPU) y vigila que
  `WEB_CONCURRENCY × (DB_POOL_SIZE + DB_MAX_OVERFLOW)` siga por debajo de
  `max_connections` de Postgres (consulta con `SHOW max_connections;`).
- `AI_MAX_CONCURRENCY` debe ser menor que `DB_POOL_SIZE + DB_MAX_OVERFLOW`: cada turno
  mantiene su conexión a la BD mientras espera la respuesta de la IA.
- El límite real suele ser la **cuota del proveedor de IA** (peticiones/tokens por minuto).
  Revísala antes del día del evento; si ves muchos 503 en los logs (`Cola de IA llena`),
  pide más cuota o sube `AI_MAX_CONCURRENCY`.
- Si un `.env` llegó a contener una API key real, rótala en el panel del proveedor.

**Prueba de carga antes del día D** (desde otra máquina, con `AI_PROVIDER=echo` para no
gastar cuota):

```bash
# 200 conexiones concurrentes contra el health (mide procesos, nginx y red)
hey -n 2000 -c 200 https://tuku.ose.lat/health
```

## Alternativa: dos Aplicaciones separadas

Si prefieres no usar Compose, crea dos **Applications** en Dokploy (usa nombres
propios como `tuku-backend` y `tuku-frontend` para no colisionar):

- **tuku-backend** → build context `backend/` (Dockerfile). Variables: las del backend de arriba.
- **tuku-frontend** → build context `frontend/` (Dockerfile), build arg `VITE_API_URL`.

Ambas deben unirse a `dokploy-network` para ver el PostgreSQL.
