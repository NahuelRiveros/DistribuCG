# Despliegue: Neon + Render + Vercel

```
Navegador ──▶ Vercel (tienda y panel) ──▶ Render (API) ──▶ Neon (base de datos)
                                             └──────────▶ Cloudinary (imágenes)
```

La explicación de cada variable está en `servidor/.env.example` y `frontend/.env.example`.
Nunca se sube un `.env` real: los valores se cargan en el panel de cada plataforma.

## Render (API) → Environment

| Variable | Qué va | De dónde sale |
|---|---|---|
| `NODE_ENV` | `production` | fijo |
| `BD_URL_NEON` | Dirección de conexión (`postgresql://…`) | Neon → Connect → Connection string |
| `BD_ESQUEMA` | Nombre del esquema del cliente (ej. `ferreteria_lopez`) | lo elegís vos (minúsculas y `_`) |
| `MIGRAR_AL_INICIAR` | `true` | fijo |
| `CLAVE_SESIONES` | Texto largo al azar, **uno nuevo por cliente** | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `URL_FRONTEND_VERCEL` | Dirección de la tienda (`https://….vercel.app`; si hay dominio propio, ambas separadas por coma) | Vercel → tu proyecto → Domains |
| `CLOUDINARY_NOMBRE_NUBE` | Cloud name | Cloudinary → Dashboard |
| `CLOUDINARY_CLAVE_API` | API Key | Cloudinary → API Keys |
| `CLOUDINARY_SECRETO_API` | API Secret | Cloudinary → API Keys |
| `CLOUDINARY_CARPETA` | Carpeta del cliente (ej. `ferreteria_lopez`) | lo elegís vos |
| `SUPERADMIN_NOMBRE` / `SUPERADMIN_EMAIL` / `SUPERADMIN_CONTRASENA` | Primer usuario administrador | vos (contraseña fuerte) |

Opcionales: `DURACION_SESION` (7d), `INTENTOS_LOGIN` (10). **No** cargar `PORT` (lo pone Render).

## Vercel (tienda y panel) → Settings → Environment Variables

| Variable | Qué va | De dónde sale |
|---|---|---|
| `VITE_URL_API_RENDER` | Dirección de la API + `/api` (ej. `https://mi-tienda-api.onrender.com/api`) | Render → tu servicio → URL arriba a la izquierda |

Todo lo que empieza con `VITE_` es **público** (queda en el navegador): nunca claves ahí.

## Nombres anteriores

El servidor todavía acepta los nombres viejos (`DB_*`, `JWT_SECRET`, `CORS_ORIGIN`, `NEON_DATABASE_URL`,
`CLOUDINARY_API_*`, `SUPERADMIN_PASSWORD`, `VITE_API_URL`) y avisa al arrancar cuáles renombrar.
Variables de DistribuCG que este proyecto **no usa** y se pueden borrar: `APP_URL`, `FRONTEND_URL`,
`MP_ACCESS_TOKEN`, `SEED_SECRET`, `SOFTWARE_CLIENTE`, `SOFTWARE_PRECIO`, `SUPERADMIN_APELLIDO`, `SUPERADMIN_DNI`.
