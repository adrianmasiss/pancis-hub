# Documentación de Pancis Hub

Conviven tres árboles de documentación. No es desorden acumulado: cada uno
cumple una función distinta y ninguno sustituye del todo a los otros. Esta
página existe para que quede claro cuál manda en cada tema.

## Qué manda cuando se contradicen

1. **Seguridad y privacidad** (`spec/docs/14_SECURITY_PRIVACY_SAFETY.md`).
2. **`spec/docs/00_NORTH_STAR.md`** y **`spec/docs/01_SCOPE_AND_MVP.md`**.
3. **`spec/docs/03_FUNCTIONAL_REQUIREMENTS.md`**.
4. **`spec/docs/20_DECISION_LOG.md`** y `DECISIONS.md`.
5. Requisitos específicos del módulo.
6. Decisiones técnicas ya tomadas en el repositorio.

## Los tres árboles

### `docs/spec/` — especificación de producto y ciencia

El paquete de redefinición (28 archivos, `00_NORTH_STAR` a `20_DECISION_LOG`,
esquemas y plantillas). Es la **fuente de verdad de producto**: alcance,
gobierno científico, motores de sustitución, modelo de datos objetivo,
seguridad y roadmap.

### `docs/*.md` (raíz de docs) — documentación técnica del sistema real

`ARCHITECTURE.md`, `DATABASE.md`, `DECISIONS.md`, `DEPLOYMENT.md`,
`SECURITY.md`, `SETUP.md`, `TESTING.md` y los numerados `01` a `10`.
Describen **lo que existe y por qué se construyó así**. Cuando `spec/`
describe un objetivo y esta capa describe el presente, ambas son correctas:
una dice a dónde vamos, la otra dónde estamos.

Ojo con la colisión de numeración: `docs/06_DATABASE_SCHEMA.md` y
`docs/spec/docs/11_DATABASE_SCHEMA.md` hablan de lo mismo con nombres de tabla
distintos. El sistema usa los del primero (`diet_templates`), no los del
segundo (`diet_plans`). No se renombró a propósito: el modelo real cumple la
misma función y renombrar sería puro riesgo.

### `_old-docs-2026-07-27/` — el set del 26 de julio

Diez documentos anteriores al paquete `spec/`. **No es material muerto:** es
la única fuente que cubre bien tres cosas que el paquete nuevo trata mal o
excluye, y que sí están en alcance:

| Archivo | Por qué sigue vigente |
|---|---|
| `06-chat-ia.md` | Especifica el chat con grounding sobre investigaciones, con la tabla de "chatbot genérico contra lo que necesita Pancis Hub" |
| `08-generacion-automatica.md` | Generación de dieta y rutina, que `spec/` excluye vía ADR-008 y el usuario sí requiere (ver ADR-011) |
| `09-biblioteca-investigaciones.md` | Separa la capa de datos (`research_sources`, `formula_versions`) de la capa navegable |

También aporta el principio **"ningún número mágico sin fuente"**
(`00-README.md`), que gobierna toda la Fase 2 de investigación.

## Documentos de trabajo

- **`AUDITORIA_2026-07-27.md`** — auditoría del sistema y plan de fases
  vigente. Las secciones J y K están sustituidas por la Revisión 2 al final.
- **`DEFECTOS_CONOCIDOS.md`** — defectos detectados y todavía sin corregir,
  con su reproducción y el motivo de haberlos pospuesto.
