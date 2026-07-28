# 12 — Arquitectura técnica

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui, Supabase/PostgreSQL, pgvector, Three.js/React Three Fiber, Zod, Recharts, Vitest y Playwright.

## Organización

```text
src/
  app/
  features/
    auth/ profile/ today/ nutrition/ food-data/
    training/ biomechanics/ biometrics/ evidence/ copilot/
  server/
    db/ tools/ providers/ policies/
  components/ lib/ types/
```

## Providers

```text
providers/food/usda.ts
providers/food/open-food-facts.ts
providers/research/pubmed.ts
providers/research/europe-pmc.ts
providers/research/crossref.ts
providers/research/openalex.ts
providers/llm/
```

La UI no llama directamente a proveedores externos.

## APIs internas

- `/api/foods/search`
- `/api/nutrition/swap`
- `/api/nutrition/day-adjustment`
- `/api/exercises/substitutes`
- `/api/evidence/search`
- `/api/copilot`
- `/api/biometrics`

## Resiliencia

Timeout, retry, circuit breaker, caché, fallback manual y mensajes claros.

## Feature flags

`AI_CHAT`, `EXTERNAL_FOOD_SEARCH`, `RESEARCH_RAG`, `INBODY_3D`, `AUTO_PLAN_GENERATION`.
