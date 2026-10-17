# Acceso con Face ID, huella o PIN

La pantalla de acceso usa passkeys (WebAuthn) a través del cliente instalado de Supabase. La verificación y emisión de sesión se realizan en Supabase Auth, no mediante una comparación local. No se guardan contraseñas ni datos biométricos para esta función. El sistema operativo decide si verifica con Face ID, huella, PIN o una llave externa; la web no puede exigir una modalidad biométrica específica.

## Activación del servicio

Supabase considera esta API experimental. El cliente ya incluye `auth.experimental.passkey: true`; además, en Authentication → Passkeys del proyecto hay que habilitar el servicio y configurar:

- Nombre: Pancis.
- RP ID: dominio estable de la aplicación, sin protocolo, puerto ni ruta.
- Origins: orígenes HTTPS exactos permitidos.

Para desarrollo local, usar una versión de Supabase Auth y CLI que soporte passkeys y aplicar la configuración ya incluida en `supabase/config.toml` (requiere reiniciar el servicio local):

```toml
[auth.passkey]
enabled = true

[auth.webauthn]
rp_display_name = "Pancis local"
rp_id = "localhost"
rp_origins = ["http://localhost:3000"]
```

No mezclar `localhost` y `127.0.0.1` al registrar o usar llaves. Las llaves de desarrollo y producción son independientes. Cambiar el RP ID invalida las llaves existentes. No habilitar en producción hasta verificar el dominio definitivo.

Referencia: https://supabase.com/docs/guides/auth/passkeys

## Uso

1. Ingresar con una cuenta confirmada y contraseña.
2. Abrir Configuración → Cuenta → Agregar llave de acceso.
3. Completar la verificación del dispositivo.
4. Cerrar sesión y seleccionar «Ingresar con Face ID o huella».
5. Las llaves se pueden eliminar desde Cuenta, con confirmación. La contraseña sigue disponible.

El botón de acceso se oculta si WebAuthn no está disponible o la conexión no es segura. No se lanza un diálogo biométrico automáticamente. Los errores y las cancelaciones conservan la alternativa de contraseña.

## Comprobación antes de publicar

- Registrar una llave real, cerrar sesión y volver a entrar en Safari/iPhone y Chrome/Android compatibles.
- Comprobar que la sesión permite cargar páginas protegidas y que cerrar sesión la elimina.
- Cancelar el diálogo y comprobar que se puede usar la contraseña.
- Eliminar una llave y verificar que ya no permite entrar.
- Verificar errores de servicio deshabilitado, navegador no compatible y desafío vencido.

Las pruebas unitarias verifican el límite de redirecciones, la ausencia de navegación sin sesión verificada y el manejo de errores. No sustituyen una prueba física de Face ID ni la verificación del servicio desplegado.
