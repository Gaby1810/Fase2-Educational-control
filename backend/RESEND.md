# Resend en 3 minutos

## 1. Crear API key

1. [resend.com](https://resend.com) → regístrate (gratis).
2. **API Keys** → **Create API Key** → copia `re_...`

## 2. Railway (producción)

Backend → **Variables** → añade:

| Variable | Valor |
|----------|--------|
| `RESEND_API_KEY` | `re_xxxxxxxx` |
| `EMAIL_FROM` | `EducationalControl <onboarding@resend.dev>` |
| `EMAIL_PROVIDER` | `resend` |

Opcional: **elimina** `GMAIL_USER` y `GMAIL_APP_PASSWORD` para no confundir.

**Redeploy** → en logs debe salir: `📧 Email: Resend listo`

## 3. Local (opcional)

En `backend/.env`:

```
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_tu_key_aqui
EMAIL_FROM=EducationalControl <onboarding@resend.dev>
```

Prueba:

```bash
cd backend
node scripts/test-resend.js tu-correo@gmail.com
```

## Importante (plan gratis)

Sin dominio verificado, Resend solo envía **al correo con el que te registraste** en Resend. Para enviar a cualquier usuario de la app, verifica un dominio en Resend → **Domains**.
