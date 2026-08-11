# Testing

## Objetivo

Construir confianza en calculos, permisos y flujos criticos del MVP.

## Herramientas

- Vitest para pruebas unitarias (`npm run test`) — 108 tests.
- React Testing Library para componentes.
- Playwright para end-to-end (`npm run test:e2e`).
- TypeScript estricto como primera linea de verificacion (`npm run typecheck`).

## End-to-end (e2e/flujo-minimo.spec.ts)

Requiere `supabase start` (con seed aplicado); Playwright levanta la app
en modo produccion automaticamente.

```bash
npm run test:e2e
```

Cubre el flujo minimo completo del MVP: registrar cuenta → onboarding de
6 pasos → registrar comida → intercambiar un alimento → sesion de
entrenamiento con serie → registrar peso → completar diario → cambiar de
objetivo y aceptar el recalculo → cambiar tema → cerrar sesion → iniciar
sesion → verificar persistencia.

El caso del recalculo comprueba las dos mitades de la regla: que guardar
el perfil NO reescribe los objetivos, y que aceptar la propuesta si lo
hace y queda en el historial.

## Estado actual (Fase C)

Pruebas existentes:

- `src/tests/navigation.test.ts`: consistencia navegacion e i18n.
- `src/tests/empty-state.test.tsx`: render de componentes compartidos.
- `src/features/onboarding/lib/nutrition-targets.test.ts`: BMR, TDEE,
  ajustes por objetivo, piso de seguridad y reparto de macros.
- `src/features/onboarding/schemas.test.ts`: validaciones Zod del onboarding.

Verificacion de RLS contra el stack local (requiere `supabase start` y seed):

```bash
set -a && source .env.local && set +a
node scripts/verify-rls.mjs
```

El script registra dos usuarios, comprueba el trigger de perfiles, el
aislamiento entre usuarios, la lectura/escritura de catalogos y el
usuario demo del seed.

## Unitarias

Cobertura inicial:

- calculo de macros por alimento, comida, dia y receta;
- formula de equivalencias;
- promedios moviles;
- tendencias;
- validaciones Zod;
- permisos y ownership helpers;
- calculo de macros de recetas desde ingredientes.

## Integracion

Flujos:

- registro e inicio de sesion;
- onboarding;
- registro de comidas;
- intercambio de alimentos;
- entrenamiento;
- mediciones corporales;
- diario inteligente.

## End-to-end minimo

1. Registrar cuenta.
2. Completar onboarding.
3. Registrar comida.
4. Cambiar un alimento.
5. Registrar entrenamiento.
6. Registrar peso.
7. Completar diario.
8. Cambiar tema.
9. Cerrar sesion.
10. Iniciar sesion de nuevo.
11. Verificar persistencia.

## Criterios

- No mergear modulos criticos sin pruebas de calculo y validacion.
- No aceptar cambios de base de datos sin revisar RLS.
- No aceptar UI critica sin estados de carga, error y vacio.
- No aceptar PWA sin revisar que datos sensibles no queden cacheados indebidamente.
