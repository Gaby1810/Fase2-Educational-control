# Despliegue en Railway — EducationalControl

## 1. Crear proyecto en Railway

1. Entra en [railway.app](https://railway.app) → **New Project**.
2. **Deploy from GitHub repo** → selecciona `EducationalControl`.
3. Añade un servicio **MySQL** (Database → Add MySQL).
4. El servicio del backend debe usar:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start` (por defecto vía `railway.toml`)

## 2. Variables de entorno (servicio Backend)

En el servicio Backend → **Variables**, conecta MySQL y define:

| Variable | Valor |
|----------|--------|
| `DB_HOST` | `${{MySQL.MYSQLHOST}}` o host del plugin |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` |
| `DB_USER` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `DB_NAME` | `educationalcontrol` |
| `JWT_SECRET` | Genera un string aleatorio largo |
| `UPLOADS_DIR` | `/app/uploads` (si usas Volume, ver abajo) |
| `NODE_OPTIONS` | `--dns-result-order=ipv4first` (si Gmail SMTP falla con ENETUNREACH) |

Railway también inyecta `PORT` automáticamente.

## 3. Dominio público

Backend → **Settings** → **Networking** → **Generate Domain**.

Copia la URL (ej. `https://educational-control-production.up.railway.app`) y actualízala en:

- `frontend/app.json` → `expo.extra.apiUrl` → `https://TU-DOMINIO.up.railway.app/api`
- `frontend/eas.json` → `build.preview.env.EXPO_PUBLIC_API_URL` (misma URL)

## 4. Importar base de datos

1. MySQL → **Connect** → copia host, puerto, usuario y contraseña.
2. Importa `backend/educationalcontrol.sql` con MySQL Workbench, DBeaver o:

```bash
mysql -h HOST -P PORT -u USER -p < backend/educationalcontrol.sql
```

3. Verifica: abre `https://TU-DOMINIO.up.railway.app/api/health` → debe responder `{"status":"ok",...}`.

## 5. Volume para uploads (recomendado)

1. Backend → **Volumes** → **Add Volume**.
2. Mount path: `/app/uploads`
3. Variable: `UPLOADS_DIR=/app/uploads`

Sin volume, los PDFs subidos se pierden al redeploy.

## 6. Generar APK conectado al servidor

Tras tener el dominio Railway y `apiUrl` actualizado en `app.json`:

```bash
cd frontend
npx eas build -p android --profile preview
```

Instala el APK y prueba login **fuera de tu WiFi** (datos móviles).

## 7. Descarga pública del APK (opcional)

Tras `eas build`, descarga el `.apk` y súbelo a Railway:

- Colócalo en `backend/releases/app.apk` y redeploy, **o**
- Usa Railway CLI / SFTP al volume si aplica.

Enlace de descarga: `https://TU-DOMINIO.up.railway.app/download`
