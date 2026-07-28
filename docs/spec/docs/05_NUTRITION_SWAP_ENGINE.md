# 05 — Motor de sustituciones nutricionales

## Propósito

Encontrar la porción de uno o varios alimentos que minimiza la diferencia respecto al alimento o comida original.

## Vector objetivo

```text
T = [kcal, proteína, carbohidratos, grasa, fibra]
```

El optimizador busca cantidades dentro de límites realistas.

## Error por nutriente

```text
error = abs(candidato - objetivo) / max(objetivo, epsilon)
```

## Función base

```text
E = wK*error_kcal + wP*error_proteína + wC*error_carbohidratos
  + wG*error_grasa + wF*error_fibra + penalizaciones
```

```text
score = clamp(10 * (1 - E_normalizado), 0, 10)
```

## Pesos contextuales iniciales

### Alimento proteico

- Proteína 0.35.
- Calorías 0.25.
- Grasa 0.20.
- Carbohidratos 0.15.
- Fibra 0.05.

### Fuente de carbohidratos

- Carbohidratos 0.35.
- Calorías 0.25.
- Proteína 0.15.
- Grasa 0.15.
- Fibra 0.10.

### Comida completa

- Calorías 0.25.
- Proteína 0.30.
- Carbohidratos 0.20.
- Grasa 0.15.
- Fibra 0.10.

Son parámetros a calibrar, no conclusiones científicas.

## Penalizaciones

- Alergia o restricción: excluir.
- Datos incompletos.
- Porción irreal.
- Estado crudo/cocido ambiguo.
- Función alimentaria diferente.
- Baja calidad del dato.

## Combinaciones

Permitir hasta dos o tres alimentos para acercarse al objetivo, por ejemplo pancakes más una fuente proteica.

## Reajuste diario

```text
restante = objetivo_diario - consumido_confirmado
```

Puede proponer cambios en comidas pendientes, pero no aplicarlos sin confirmación.

## Respuesta obligatoria

- Porción original y sustituta.
- Calorías y macros antes/después.
- Diferencias absolutas y porcentuales.
- Compatibilidad.
- Confianza de datos.
- Fuente.
- Explicación.
- Ajuste opcional.

## Regla del ejemplo huevos/pancakes

No usar valores genéricos. Solicitar receta, marca o registro específico de pancakes antes de calcular.
