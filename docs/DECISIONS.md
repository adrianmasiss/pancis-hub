# Decisiones tecnicas

## 2026-07-19 - Documentacion como fuente de verdad

La documentacion existente en raiz se mueve a `docs/` porque el README ya declara esa estructura. No se elimina contenido valido.

## 2026-07-19 - Implementacion por fases

El alcance completo del prompt excede un cambio unico seguro. El proyecto se construira por fases: arquitectura, fundamentos, datos/auth, modulos MVP y calidad.

## 2026-07-19 - Supabase como backend oficial

Se adopta Supabase para Auth, PostgreSQL, Storage y Row Level Security porque coincide con los requisitos del producto y cubre el modelo multiusuario.

## 2026-07-19 - Offline limitado por privacidad

La PWA no almacenara datos corporales sensibles sin proteccion en `localStorage`. El soporte offline priorizara shell de aplicacion, contenido no sensible y sincronizacion controlada.

## 2026-07-19 - Asistente deterministico inicial

Mientras no exista una API de IA configurada, el asistente usara reglas deterministicas y respuestas demo claramente identificadas. Las claves reales nunca se expondran en frontend.

## 2026-07-19 - Evidencia cientifica

No se inventaran estudios, autores, DOI ni citas. Cuando una referencia no este verificada se usara el placeholder `Referencia pendiente de verificacion.`.
