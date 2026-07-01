# Manual del administrador

> La Fase 1 entrega la base de la plataforma. Los paneles de administración
> visuales completos se incorporan en fases posteriores; aquí se documenta la
> operación actual.

## Roles del sistema

| Rol | Capacidades (objetivo) |
|-----|------------------------|
| `student` | Usar el tutor, ver su progreso, ranking y materias. |
| `teacher` | Gestionar estudiantes, banco de preguntas, reportes. |
| `admin` | Administrar la academia, cursos, licencias, usuarios. |
| `superadmin` | Gestión multiacademia (SaaS). |

El control de acceso por rol está disponible vía `api/deps.py::require_roles(...)`.

## Gestión de usuarios (actual)

- Alta de estudiantes: endpoint `POST /api/v1/auth/register` o desde la pantalla de registro.
- Usuario demo sembrado: `estudiante@preu.pe` / `estudiante123` (cámbialo o elimínalo en producción).

## Configuración de IA

En `.env`:

- `AI_PROVIDER` selecciona el motor (`anthropic`, `openai`, `gemini`, `echo`).
- Coloca la API key correspondiente. **Nunca** subas claves reales al repositorio.
- `echo` permite operar en modo demostración sin costo.

## Copias de seguridad

Los datos persisten en el volumen Docker `postgres_data`. Respaldo:

```bash
docker compose exec db pg_dump -U preu preu_mentor > backup_$(date +%F).sql
```

## Despliegue en Dokploy

1. Conecta el repositorio.
2. Define las variables de entorno (`.env`) en el panel de Dokploy.
3. Dokploy usa `docker-compose.yml`. Configura Nginx/dominio y certificados TLS.
4. Ajusta `BACKEND_CORS_ORIGINS` y `VITE_API_URL` al dominio real.

## Seguridad en producción — checklist

- [ ] `SECRET_KEY` fuerte y único.
- [ ] `ENVIRONMENT=production`, `DEBUG=false`.
- [ ] Contraseñas de PostgreSQL/MinIO cambiadas.
- [ ] API keys de IA fuera del control de versiones.
- [ ] TLS habilitado en el reverse proxy.
- [ ] Backups automáticos programados.
