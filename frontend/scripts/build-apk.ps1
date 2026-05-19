# Genera APK preview conectado a Railway.
# Antes: actualiza EXPO_PUBLIC_API_URL en eas.json (perfil preview) con tu dominio Railway.

$apiUrl = (Get-Content ..\eas.json -Raw | Select-String 'EXPO_PUBLIC_API_URL').ToString()
if ($apiUrl -match 'REPLACE-WITH-YOUR-RAILWAY-DOMAIN') {
    Write-Error @"
Actualiza la URL de Railway en:
  - frontend/eas.json  -> build.preview.env.EXPO_PUBLIC_API_URL
  - frontend/app.json  -> expo.extra.apiUrl

Luego ejecuta de nuevo este script.
"@
    exit 1
}

Set-Location $PSScriptRoot\..
npx eas build -p android --profile preview --non-interactive
