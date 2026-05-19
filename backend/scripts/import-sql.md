# Importar educationalcontrol.sql en MySQL Railway

1. Railway → servicio **MySQL** → pestaña **Connect**.
2. Anota `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`.
3. Crea la base si no existe (el dump incluye `CREATE DATABASE`):

```bash
mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -p < ../educationalcontrol.sql
```

Desde la raíz del repo en Windows (PowerShell), con cliente MySQL instalado:

```powershell
Get-Content ..\educationalcontrol.sql | mysql -h HOST -P PORT -u USER -p
```

4. Verifica el backend desplegado:

```bash
curl https://TU-DOMINIO.up.railway.app/api/health
```

Respuesta esperada: `{"status":"ok","timestamp":"..."}`
