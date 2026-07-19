# Seguridad y privacidad

## Aviso obligatorio

Pancis Hub es una herramienta educativa y de seguimiento. No sustituye la evaluacion, el diagnostico ni el tratamiento de profesionales de la salud.

## Modelo de seguridad

- Supabase Auth para identidad.
- Row Level Security en tablas privadas.
- Control por propietario con `user_id = auth.uid()`.
- Validacion de entrada en servidor con Zod.
- Errores seguros sin detalles internos.
- Buckets privados para fotografias y archivos corporales.
- URLs firmadas para descargas privadas.

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
