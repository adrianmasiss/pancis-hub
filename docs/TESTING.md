# Testing

## Objetivo

Construir confianza en calculos, permisos y flujos criticos del MVP.

## Herramientas objetivo

- Vitest para pruebas unitarias.
- React Testing Library para componentes e integracion.
- Playwright para end-to-end.
- TypeScript estricto como primera linea de verificacion.

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
