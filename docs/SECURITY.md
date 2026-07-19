# Seguridad y privacidad

## Aviso obligatorio

Pancis Hub es una herramienta educativa y de seguimiento. No sustituye la evaluacion, el diagnostico ni el tratamiento de profesionales de la salud.

## Modelo de seguridad

- Supabase Auth para identidad; sesion refrescada en `src/proxy.ts`
  (la convencion de Next.js 16 que reemplaza a middleware) y validada con
  `supabase.auth.getUser()` en servidor.
- Dos capas en base de datos: GRANT por rol + Row Level Security habilitado
  en TODAS las tablas (ver docs/DATABASE.md). `anon` no tiene privilegios
  sobre datos.
- Control por propietario con `user_id = auth.uid()`; tablas hijas validan
  contra el padre con `EXISTS`.
- Rutas privadas protegidas en el proxy y de nuevo en los layouts de
  servidor (defensa en profundidad).
- Validacion en servidor con Zod dentro de cada Server Action, ademas de la
  validacion de cliente.
- Errores seguros: los mensajes al usuario son genericos y en espanol; no se
  filtran codigos internos. La recuperacion de contrasena responde igual
  exista o no el correo (sin enumeracion de cuentas).
- Redirecciones solo a rutas internas (previene open redirects en `next=`).
- Buckets privados (`progress-photos`, `inbody-files`) con politicas por
  propietario, limite de tamano y validacion MIME; lectura via URLs firmadas.
- Claves solo en variables de entorno; `SUPABASE_SERVICE_ROLE_KEY` jamas se
  usa en codigo de cliente.

## Datos sensibles

Se consideran sensibles:

- mediciones corporales;
- fotografias de progreso;
- diarios de sueno, hambre, estres, estado de animo y adherencia;
- restricciones, alergias y preferencias alimentarias;
- recomendaciones personalizadas.

No deben almacenarse sin proteccion en `localStorage`.

## Archivos

Validaciones minimas:

- MIME permitido;
- limite de tamano;
- extension esperada;
- propietario;
- bucket privado;
- URL firmada de corta duracion.

## Asistente

El asistente no debe:

- diagnosticar;
- prescribir medicamentos;
- sustituir profesionales;
- presentar estimaciones como certezas;
- modificar objetivos sin confirmacion;
- recomendar practicas peligrosas.

Debe indicar cuando buscar atencion profesional.

## Privacidad por defecto

- Cada usuario ve solo sus datos.
- Fotografias privadas por defecto.
- Preparar arquitectura para exportacion y eliminacion de cuenta.
- Minimizar datos recolectados.
- Registrar cambios administrativos relevantes en `audit_logs`.
