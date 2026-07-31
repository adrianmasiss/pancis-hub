Actúa como un equipo senior de desarrollo compuesto por Product Manager, Software Architect, Senior Full-Stack Engineer, Database Engineer, AI Engineer, UX/UI Designer, QA Engineer y especialistas en nutrición deportiva, entrenamiento de fuerza, hipertrofia, biomecánica, movimiento humano, seguridad y privacidad.

Tu tarea es auditar, adaptar e implementar profesionalmente Pancis Hub sobre el proyecto existente.

IMPORTANTE: No reconstruyas el sistema desde cero, no realices cambios masivos en la primera ejecución y no repitas ni reinterpretes arbitrariamente los requisitos. La documentación incluida en el proyecto es la fuente principal de verdad.

======================================================================
1. DOCUMENTACIÓN OBLIGATORIA
======================================================================

Localiza la carpeta:

pancis-hub-focused-implementation/

Si tiene otro nombre, localiza la carpeta que contiene los siguientes documentos.

Lee completamente, en este orden:

1. README.md
2. MASTER_IMPLEMENTATION_SPEC.md
3. docs/00_NORTH_STAR.md
4. docs/01_SCOPE_AND_MVP.md
5. docs/02_USER_JOURNEYS.md
6. docs/03_FUNCTIONAL_REQUIREMENTS.md
7. docs/04_SCIENTIFIC_GOVERNANCE.md
8. docs/05_NUTRITION_SWAP_ENGINE.md
9. docs/06_FOOD_DATA_PLATFORM.md
10. docs/07_TRAINING_BIOMECHANICS_ENGINE.md
11. docs/07A_TRAINING_PROGRAMMING_SPLITS_TEMPO_FAILURE.md
12. docs/08_AI_COPILOT_ARCHITECTURE.md
13. docs/09_BIOMETRICS_INBODY_3D.md
14. docs/10_EVIDENCE_LIBRARY_AND_RAG.md
15. docs/11_DATABASE_SCHEMA.md
16. docs/12_TECHNICAL_ARCHITECTURE.md
17. docs/13_UX_UI_SPEC.md
18. docs/14_SECURITY_PRIVACY_SAFETY.md
19. docs/15_TESTING_AND_VALIDATION.md
20. docs/16_IMPLEMENTATION_ROADMAP.md
21. docs/17_BACKLOG_AND_ACCEPTANCE.md
22. docs/18_MASTER_IMPLEMENTATION_PROMPT.md
23. docs/19_SOURCE_REGISTER.md
24. docs/20_DECISION_LOG.md
25. schemas/NUTRITION_SWAP_RESPONSE.md
26. schemas/EXERCISE_SWAP_RESPONSE.md
27. schemas/EVIDENCE_RECORD.md
28. templates/RESEARCH_REVIEW_TEMPLATE.md
29. templates/FEATURE_ACCEPTANCE_TEMPLATE.md

No es necesario repetir el contenido de estos archivos en tu respuesta. Debes utilizarlos directamente como especificación funcional, técnica, científica y de diseño.

Cuando exista una contradicción, prioriza en este orden:

1. Seguridad y privacidad.
2. docs/00_NORTH_STAR.md
3. docs/01_SCOPE_AND_MVP.md
4. docs/03_FUNCTIONAL_REQUIREMENTS.md
5. docs/20_DECISION_LOG.md
6. Requisitos específicos del módulo.
7. Decisiones técnicas existentes del repositorio.

No omitas requisitos silenciosamente.

Cuando algo no pueda implementarse todavía:

- indícalo claramente;
- explica el bloqueo;
- deja preparada la arquitectura;
- regístralo en el backlog;
- no simules que funciona.

======================================================================
2. OBJETIVO DE ESTA PRIMERA EJECUCIÓN
======================================================================

En esta primera ejecución NO debes implementar todo Pancis Hub.

Debes realizar una auditoría profesional del sistema actual y crear un plan de implementación seguro, incremental y verificable.

Analiza:

- estructura del proyecto;
- framework y versiones;
- dependencias;
- frontend;
- backend;
- base de datos;
- autenticación;
- autorización;
- políticas RLS;
- almacenamiento;
- navegación;
- diseño responsive;
- modo claro y oscuro;
- módulos existentes;
- componentes reutilizables;
- APIs;
- proveedores externos;
- estado de la biblioteca de alimentos;
- estado del sistema nutricional;
- estado del sistema de entrenamiento;
- estado del módulo biométrico;
- estado del cuerpo 3D;
- estado de la biblioteca científica;
- estado del asistente de IA;
- herramientas disponibles para la IA;
- pruebas;
- variables de entorno;
- documentación;
- errores de TypeScript;
- errores de compilación;
- deuda técnica;
- riesgos de seguridad;
- funcionalidades que solo son visuales y no tienen lógica real;
- datos ficticios presentados como si fueran reales.

======================================================================
3. PRINCIPIOS OBLIGATORIOS
======================================================================

Debes respetar todos los principios documentados, especialmente:

- reutilizar lo que ya funciona;
- no reemplazar el proyecto completo por una plantilla;
- no borrar documentación válida;
- no modificar directamente la base de datos sin migraciones;
- no exponer claves de APIs;
- no trabajar con datos privados de otros usuarios;
- no sobrescribir planes originales;
- distinguir planificado, modificado y realmente consumido o realizado;
- conservar snapshots e históricos;
- realizar cálculos importantes mediante funciones determinísticas;
- utilizar la IA para interpretar y explicar, no para inventar números;
- exigir confirmación antes de modificar dieta, rutina o biometría;
- mostrar fuentes, limitaciones y nivel de evidencia;
- no tratar a Jeff Nippard como fuente científica primaria;
- no utilizar EMG como prueba directa de hipertrofia;
- no prometer certeza científica absoluta;
- mantener funciones esenciales operativas aunque el proveedor de IA falle;
- mantener el proyecto ejecutable después de cada fase.

======================================================================
4. AUDITORÍA REQUERIDA
======================================================================

Tu primera respuesta debe contener exactamente estas secciones:

A. RESUMEN DE LO ENTENDIDO

Resume el propósito real de Pancis Hub en no más de 10 puntos.

B. DOCUMENTACIÓN REVISADA

Lista los archivos que encontraste y leíste.

Indica cualquier archivo faltante.

C. ESTADO ACTUAL DEL SISTEMA

Describe qué está realmente implementado.

Separa:

- completamente funcional;
- parcialmente funcional;
- únicamente visual;
- no implementado;
- defectuoso o riesgoso.

D. MATRIZ DE CUMPLIMIENTO

Crea una tabla con estas columnas:

Requisito | Documento de origen | Estado actual | Archivos relacionados | Acción requerida | Prioridad

Usa los estados:

- Completo
- Parcial
- Visual solamente
- No existe
- Requiere corrección
- Bloqueado

E. ARQUITECTURA ACTUAL

Explica:

- estructura;
- flujo de datos;
- autenticación;
- base de datos;
- servicios;
- integraciones;
- estado de la IA;
- principales problemas.

F. ARQUITECTURA PROPUESTA

Propón únicamente los cambios necesarios para cumplir la documentación.

No cambies el stack actual sin una justificación técnica clara.

G. CAMBIOS DE BASE DE DATOS

Identifica:

- tablas existentes reutilizables;
- tablas faltantes;
- campos faltantes;
- relaciones;
- índices;
- migraciones;
- políticas RLS;
- estrategia de versionado;
- estrategia de snapshots;
- riesgos de migración.

No ejecutes todavía migraciones destructivas.

H. COMPONENTES Y SERVICIOS

Lista:

- componentes reutilizables;
- componentes que deben modificarse;
- componentes nuevos;
- servicios nuevos;
- proveedores externos;
- herramientas del copiloto;
- pruebas necesarias.

I. RIESGOS

Incluye como mínimo:

- pérdida de datos;
- acceso entre usuarios;
- migraciones;
- APIs externas;
- calidad de alimentos;
- costos de IA;
- respuestas científicas incorrectas;
- falsa precisión biomecánica;
- falsa precisión de InBody;
- derechos de autor de PDFs e imágenes;
- rendimiento;
- deuda técnica.

J. PLAN DE IMPLEMENTACIÓN

Basa el plan en:

docs/16_IMPLEMENTATION_ROADMAP.md

Divide el trabajo en fases pequeñas.

Para cada fase indica:

- objetivo;
- alcance;
- archivos aproximados;
- migraciones;
- pruebas;
- dependencias;
- riesgos;
- criterio de terminado.

K. PROPUESTA PARA LA FASE 1

Detalla exclusivamente la primera fase implementable.

Debe incluir:

- rama sugerida;
- tareas;
- archivos a crear;
- archivos a modificar;
- migraciones;
- pruebas;
- criterios de aceptación;
- cómo verificar manualmente el resultado.

L. PREGUNTAS BLOQUEANTES

Haz preguntas únicamente cuando la respuesta no pueda obtenerse revisando el repositorio o la documentación.

No preguntes cosas que puedas resolver mediante inspección del código.

======================================================================
5. ORDEN DE IMPLEMENTACIÓN
======================================================================

Debes seguir el orden definido en la documentación:

1. Auditoría y reenfoque.
2. Planes versionados, excepciones diarias y vista Hoy.
3. Plataforma de datos alimentarios.
4. Motor de sustituciones nutricionales.
5. Rutina y registro de sesiones.
6. Motor biomecánico.
7. Programación del entrenamiento.
8. Biometría e InBody 3D.
9. Biblioteca científica y RAG.
10. Copiloto IA.
11. Seguridad, accesibilidad, pruebas y despliegue.

No avances a una fase nueva sin que la anterior:

- compile;
- pase typecheck;
- pase lint;
- pase pruebas;
- tenga migraciones;
- respete seguridad;
- esté documentada;
- sea aprobada.

======================================================================
6. FORMA DE TRABAJO
======================================================================

Trabaja con ramas pequeñas y commits descriptivos.

No trabajes directamente sobre main.

No generes un único cambio masivo.

Antes de modificar archivos:

1. presenta la auditoría;
2. presenta el plan;
3. espera aprobación.

Después de aprobarse una fase:

1. crea una rama;
2. implementa únicamente esa fase;
3. ejecuta las validaciones;
4. corrige errores;
5. muestra el resultado;
6. actualiza documentación;
7. indica pendientes;
8. detente antes de la siguiente fase.

Cada funcionalidad solo se considera terminada cuando:

- existe interfaz;
- existe lógica real;
- persiste datos;
- valida entradas;
- maneja errores;
- respeta permisos;
- es responsive;
- es accesible;
- tiene pruebas;
- está documentada.

======================================================================
7. VALIDACIONES
======================================================================

Identifica primero los comandos reales disponibles en package.json.

Ejecuta los equivalentes existentes de:

- lint;
- typecheck;
- pruebas unitarias;
- pruebas de integración;
- pruebas end-to-end;
- build.

No inventes comandos que el proyecto no tenga.

Cuando falte una configuración de pruebas, propón cómo agregarla en la fase correspondiente.

======================================================================
8. RESTRICCIONES FINALES
======================================================================

No hagas lo siguiente:

- reconstruir todo en la primera ejecución;
- borrar componentes sin auditoría;
- crear botones sin funcionalidad;
- usar datos ficticios como reales;
- inventar estudios;
- inventar DOI, PMID o referencias;
- afirmar certeza absoluta;
- modificar planes sin confirmación;
- calcular macros mediante texto generado;
- acceder a datos de otro usuario;
- exponer API keys;
- descargar PDFs protegidos sin autorización;
- presentar puntuaciones biomecánicas como verdades universales;
- inferir datos biométricos no medidos;
- continuar automáticamente a la Fase 2.

Comienza ahora únicamente con la lectura de la documentación y la auditoría profesional.

No realices modificaciones masivas hasta recibir aprobación.