# Arquitectura y Stack Técnico

## Plataforma

PWA (Progressive Web App) móvil-first, multi-usuario. Se instala como app pero corre sobre web — evita el costo y la fricción de publicar en App Store/Play Store mientras el producto se valida, y es compatible con las skills de diseño ya instaladas en el proyecto (`apple-design` está pensada justamente para gestos y transiciones de PWA móvil).

## Autenticación y datos multi-usuario

Cada persona tiene su propia cuenta, su propia biometría, su propia dieta/rutina y su propio historial de chat. Requiere:

- Autenticación (email/password como mínimo; login social opcional más adelante)
- Aislamiento estricto de datos por usuario a nivel de base de datos (cada consulta filtrada por `user_id`, nunca confiar solo en el frontend para eso)
- Un rol de administrador/curador para gestionar la biblioteca de investigaciones central, que es compartida entre todos los usuarios (no es un dato por-usuario)

## Fuente de datos de alimentos: USDA FoodData Central

- **Costo:** gratis, sin necesidad de tarjeta.
- **Autenticación:** requiere una API key gratuita de [api.data.gov](https://api.data.gov) — sin key (usando `DEMO_KEY`) el límite baja a 30 solicitudes/hora, con key sube a **1.000 solicitudes/hora por IP**. Conseguir la key propia es un paso obligatorio del setup inicial, no opcional.
- **Qué cubre bien:** alimentos base y genéricos (proteínas, vegetales, granos, lácteos) con datos oficiales del gobierno de EEUU, muy confiables para macros.
- **Qué cubre mal:** productos de marca/empaquetados específicos (el caso "tengo esta marca puntual en mi despensa"), que es donde MyFitnessPal es más fuerte porque usa bases crowdsourced como Open Food Facts.
- **Implicancia de diseño:** el buscador de alimentos debe dejar claro cuándo un resultado es un alimento genérico verificado (USDA) versus algo que el usuario cargó manualmente o que vino de una sugerencia de la IA sin verificar contra una base oficial. No mezclar ambas fuentes sin distinguirlas visualmente.
- **Nota para v2/v3:** si el volumen de "no lo encuentro en USDA" resulta alto en el uso real, sumar Open Food Facts (también gratis, más cobertura de marcas, pero crowdsourced y con menor control de calidad) es la vía de expansión natural.

Fuente: [USDA FoodData Central API — guía y límites](https://calorieapi.com/blog/usda-fooddata-central-api-guide)

## Motor de IA: Gemini API (tier gratuito)

Esta es la decisión con más riesgo oculto del stack, y hay que diseñarla con cuidado desde el día uno.

### Límites reales del tier gratuito (2026)

Google no garantiza estos números y los ha recortado sin aviso antes (bajó las cuotas gratuitas entre 50-80% en diciembre de 2025), pero al momento de escribir este documento:

| Modelo | Requests por minuto | Requests por día | Notas |
|---|---|---|---|
| Gemini 2.5 Flash | 10 RPM | 250/día | Recomendado para este proyecto: mejor balance costo/calidad |
| Gemini 2.5 Flash-Lite | 15 RPM | 1.000/día | Más cuota, pero razonamiento más débil — usar solo para tareas simples (ej. clasificar una sustitución, no para el chat abierto) |
| Gemini 2.5 Pro | — | — | Ya no está disponible en el tier gratuito desde abril 2026 |

Todos comparten un límite de 250.000 tokens por minuto y contexto de 1M tokens. Estos límites aplican **mientras la facturación esté desactivada en el proyecto** — si en algún momento se activa billing para desbloquear algo, el tier gratuito desaparece por completo para ese proyecto.

Fuente: [Gemini API Free Tier Complete Guide 2026](https://www.aifreeapi.com/en/posts/gemini-api-free-tier-complete-guide)

### Por qué esto es un problema de diseño y no solo de costo

250-1.000 solicitudes por día es una cuota **para todo el sistema, compartida entre todos los usuarios**, no por usuario. Con 20 usuarios activos haciendo 3-4 preguntas por día cada uno, el MVP ya está cerca del techo del tier gratuito. Esto tiene que resolverse en el diseño, no ignorarse hasta que falle en producción:

1. **No todo necesita IA generativa.** El cálculo de macros objetivo, la búsqueda de sustitutos por equivalencia numérica de macros, y el filtrado de ejercicios por región muscular son lógica determinística (fórmulas + consultas a la base de datos), no llamadas a Gemini. Reservar Gemini para lo que realmente requiere lenguaje natural o razonamiento abierto: el chat libre y la redacción de la explicación de una sustitución.
2. **Cachear agresivamente.** Si dos usuarios preguntan algo equivalente ("¿puedo cambiar pollo por atún hoy?"), la respuesta razonada no debería regenerarse desde cero cada vez si el contexto nutricional es el mismo.
3. **Rate limiting por usuario** a nivel de aplicación, para que una sola persona no consuma la cuota diaria completa del sistema.
4. **Monitorear el uso real desde el día uno** del MVP, para saber con datos reales — no estimados — cuándo hace falta pasar a un tier pago o a un modelo open-source autoalojado para parte del tráfico.

### Alternativa considerada y descartada por ahora

Claude API fue evaluada pero requiere facturación activa desde el principio (no tiene tier gratuito de uso continuo), lo cual choca con el requisito de mantener el sistema gratis mientras se valida. Gemini se elige por eso, con los límites de arriba documentados explícitamente para no descubrirlos en producción.

## Hosting

Pendiente de decidir en la sesión técnica inicial. Requisito no negociable: debe tener un tier gratuito real (no solo trial por tiempo limitado) para no romper el principio de "gratis por defecto" del proyecto. Se recomienda evaluar opciones con tier gratuito permanente para frontend (PWA estática) y backend/DB (funciones serverless + base de datos gestionada) antes de escribir código.
