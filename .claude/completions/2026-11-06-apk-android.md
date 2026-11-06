# APK de Android e íconos por acento (2026-11-06)

## Qué hay
- `android/`: Trusted Web Activity a mano (androidbrowserhelper 2.5.0, AGP 8.11.1, Gradle 8.13,
  compileSdk 36, minSdk 24). Paquete `com.pancishub.app`. Abre `https://pancis-hub.vercel.app/?origen=apk`.
- 8 `activity-alias` (`.IconoNaranja` … `.IconoMerlot`), uno por acento, solo uno encendido.
  `IconoActivity` atiende `pancis://icono/<acento>` y cambia el alias encendido.
- Web: `src/mobile/apk.ts` anota si corre en el APK (`?origen=apk` o referrer `android-app://`) y, al
  elegir acento en Perfil, abre `pancis://icono/<acento>` y cambia el `apple-touch-icon`.
- iPhone: `generateMetadata` en `app/layout.tsx` sirve `/icons/acento/<acento>-180.png` según la cookie.
  iOS solo lo lee al «Agregar a inicio».
- Íconos: `python3 scripts/generar-iconos-acento.py` (web + mipmaps del APK).
- `public/.well-known/assetlinks.json` con la huella SHA-256 de la llave; `/.well-known` es pública en el proxy.
- La ruta de recordatorios hace `trim()` del `CRON_SECRET` (en Vercel se coló un salto de línea → 401).

## Compilar
```
cd android
JAVA_HOME=$(/usr/libexec/java_home -v 17) ./gradlew assembleRelease
# → app/build/outputs/apk/release/app-release.apk
```
Necesita `android/keystore.properties` (ignorado) y `android/local.properties` (`sdk.dir=…`).

## Llave de firma
`~/.pancis-hub/android/pancis-hub.jks` + `keystore.properties` (contraseña). FUERA del repo. Sin ella no se
puede actualizar el APK instalado. Huella: 33:47:F3:C0:…:D9:83.

## Verificado
- Compila y firma (apksigner). En emulador API 36.1: `pancis://icono/lima` → solo `.IconoLima` en el
  lanzador; luego cyan → solo `.IconoCyan`.
- Local: `apple-touch-icon` = `lima-180.png` con cookie lima; `/.well-known/assetlinks.json` → 200 JSON.
- Pendiente: push (assetlinks, cambio de ícono y trim del secreto) y probar en un teléfono real.
