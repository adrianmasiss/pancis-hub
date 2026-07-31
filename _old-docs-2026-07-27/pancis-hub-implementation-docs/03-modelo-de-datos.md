# Modelo de Datos

Este documento describe las entidades principales y sus relaciones, sin fijar todavía el motor de base de datos concreto (eso se decide junto con el hosting en `02-arquitectura-y-stack.md`). Sirve para que cualquier módulo se implemente contra el mismo modelo.

## Entidades núcleo (Fase 0 / MVP)

### `users`
Cuenta de cada persona. Campos mínimos: id, email, password_hash, fecha de alta, rol (`user` | `admin`).

### `biometric_profiles`
Datos biométricos de un usuario, versionados en el tiempo (no se sobrescriben, se agregan registros nuevos para poder ver evolución).
Campos: user_id, fecha, peso_kg, altura_cm, edad, sexo, nivel_actividad, % grasa corporal (opcional, viene de InBody real o estimado), % masa muscular (opcional).

### `macro_targets`
Objetivos calculados de macros para un usuario, derivados de su `biometric_profile` más reciente más las fórmulas activas en `research_sources` (ver `09-biblioteca-investigaciones.md`). Se recalculan cuando cambia el peso o el objetivo (déficit, mantenimiento, superávit).
Campos: user_id, fecha_calculo, calorias_objetivo, proteina_g, carbohidratos_g, grasas_g, formula_fuente_id (referencia a la investigación usada).

### `foods`
Caché local de alimentos consultados desde USDA FoodData Central (evita pegarle a la API por cada búsqueda repetida), más alimentos cargados manualmente por un usuario o sugeridos por la IA.
Campos: id, nombre, fuente (`usda` | `manual` | `ia_sugerido`), fdc_id (id externo de USDA si aplica), calorias_100g, proteina_100g, carbohidratos_100g, grasas_100g, verificado (booleano).

### `diet_days`
La dieta planificada de un usuario para un día concreto. Es la entidad clave del "cambio puntual por un día": un registro acá no afecta el plan base, solo ese día.
Campos: user_id, fecha, lista de comidas (ver `diet_day_items`), es_dia_modificado (booleano), nota_del_cambio.

### `diet_day_items`
Cada alimento/porción dentro de un `diet_day`.
Campos: diet_day_id, food_id, porciones o gramos, comida_del_dia (desayuno/almuerzo/cena/snack), es_sustituto_de (referencia opcional a otro `diet_day_item`, para trazabilidad de qué reemplazó a qué).

### `exercises`
Catálogo de ejercicios. La parte crítica de este catálogo, distinta a un catálogo genérico, es el etiquetado por región muscular específica (ver `05-modulo-ejercicio.md`).
Campos: id, nombre, grupo_muscular_principal, region_especifica (ej. "pecho superior/clavicular", "pecho inferior/esternal"), patrón_de_movimiento, equipo_necesario, fuente_biomecanica_id (referencia a la investigación que sustenta la clasificación).

### `routines`
Rutina base de un usuario (plan general, no un día puntual).
Campos: user_id, nombre, dias_por_semana, activa (booleano).

### `routine_days`
Cada día de entrenamiento dentro de una rutina, con su lista de ejercicios y series/repeticiones objetivo.

### `routine_day_logs`
El equivalente de `diet_days` pero para ejercicio: el registro de qué se entrenó realmente un día concreto, incluyendo sustituciones puntuales de un ejercicio por otro.
Campos: user_id, fecha, routine_day_id (referencia al día planificado), lista de ejercicios realmente hechos, es_dia_modificado, nota_del_cambio.

### `chat_messages`
Historial de conversación del asistente de IA, por usuario, para que el chat tenga memoria de la conversación y así el sistema le pueda dar contexto a Gemini sin tener que repetir todo cada vez.
Campos: user_id, rol (`user` | `assistant`), contenido, fecha, referencias_usadas (ids de `research_sources` citados en esa respuesta, si aplica).

## Entidades de la biblioteca de investigaciones (compartidas, no por-usuario)

### `research_sources`
Cada estudio, posición oficial de una asociación científica, o fuente equivalente que sustenta una fórmula o clasificación del sistema.
Campos: id, titulo, autores, año, tipo (`estudio` | `revisión` | `posición oficial` | `otro`), url_o_pdf, resumen, area (`nutrición` | `entrenamiento` | `biomecánica` | `otro`).

### `formula_versions`
Una fórmula concreta (ej. "gramos de proteína por kg de peso corporal para hipertrofia") versionada, vinculada a una o más `research_sources`. Permite que el sistema cambie de fórmula cuando aparece evidencia mejor, sin perder el historial de qué se usó antes.
Campos: id, nombre, descripcion, expresion_o_regla, activa, research_source_ids (uno o más).

## Relación entre entidades (resumen)

```
users 1—N biometric_profiles
users 1—N macro_targets
users 1—N diet_days 1—N diet_day_items —N foods
users 1—N routines 1—N routine_days —N exercises
users 1—N routine_day_logs
users 1—N chat_messages

research_sources 1—N formula_versions
macro_targets —1 formula_versions (qué fórmula se usó)
exercises —1 research_sources (qué sustenta la clasificación por región muscular)
chat_messages —N research_sources (qué se citó en una respuesta)
```

## Entidades que se agregan en v2 (no construir en MVP)

- `body_regions_3d`: mapeo entre zonas clicables del modelo 3D y los campos de `biometric_profiles` que muestran (ver `07-inbody-3d.md`).
- `research_documents`: versión navegable de `research_sources` con el PDF completo adjunto, no solo el resumen (ver `09-biblioteca-investigaciones.md`).
