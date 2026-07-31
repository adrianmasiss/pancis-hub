# 06 — Plataforma de datos alimentarios

## Arquitectura híbrida

1. Base local.
2. USDA FoodData Central.
3. Open Food Facts.
4. Alimentos personalizados.
5. Proveedor premium opcional futuro.

## USDA FoodData Central

Adecuado para alimentos genéricos y nutrientes. Sus datos se publican bajo CC0. La API key debe permanecer en servidor.

## Open Food Facts

Adecuado para productos empacados, códigos de barras, marcas e imágenes. Sus datos son colaborativos y pueden estar incompletos; debe mostrarse calidad y fuente.

## Flujo

```text
consulta -> alias español -> búsqueda local -> proveedores externos
-> normalización -> deduplicación -> selección -> importación local
```

## Interfaz

```ts
interface FoodProvider {
  search(query: string, locale: string): Promise<ProviderFood[]>
  getById(id: string): Promise<ProviderFood | null>
  getByBarcode?(barcode: string): Promise<ProviderFood | null>
  normalize(input: unknown): NormalizedFood
  healthcheck(): Promise<boolean>
}
```

## Modelo normalizado

Nutrientes por 100 g, nombre, traducción, marca, código, imagen, preparación, fuente, confianza, fecha e identificador externo.

## Preparación

`raw`, `cooked`, `boiled`, `baked`, `fried`, `grilled`, `drained`, `prepared`, `unknown`.

No fusionar arroz crudo y arroz cocido.

## Calidad

- Verificado.
- Externo.
- Personalizado.
- Incompleto.

## Caché

- Búsquedas externas: 24 horas.
- Detalle: 30 días.
- Alimentos elegidos: persistentes.

## Imágenes

Usar imagen licenciada del proveedor, imagen propia o placeholder. Registrar atribución.

## Costa Rica y español

Añadir alias locales, unidades comunes, productos de Open Food Facts y alimentos personalizados; curación regional futura.
