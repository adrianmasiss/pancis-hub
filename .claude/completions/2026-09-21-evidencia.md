# Evidencia: las tres capas de certeza, con datos reales

**Fecha**: 2026-09-21

## Lo que habia debajo

La pantalla no hubo que inventarla: el modelo de datos ya la describia.

| Capa del handoff | De donde sale | Cuanto hay |
| --- | --- | --- |
| Evidencia | `research_sources` | 20 estudios |
| Interpretacion | `formula_versions` + `formula_version_sources` | 21 constantes, 27 vinculos |
| Inferencia personalizada | `nutrition_targets` del usuario | sus cinco cifras |

Y una capa de honestidad que ya estaba en los datos y nadie mostraba:
**`is_product_parameter` marca 7 de las 21 constantes como criterio de la app,
no como lectura de la evidencia**. Mezclarlas sin decirlo seria presentar una
decision del producto como ciencia.

El vinculo lleva `role` —`sustenta`, `matiza`, `contradice`— y la nota del
revisor. Eso es lo que separa "nivel A" de lo que ese nivel A dice sobre ESTA
cifra, y ahora se ve.

## El anillo 3D no esta, a proposito

El handoff dibuja las fuentes como lomos en un anillo que gira. Su propio
README exige **alternativa tabular obligatoria** para cualquier visualizacion
3D. Esto es esa alternativa, que es la parte que de verdad comunica; el anillo
va encima despues, no debajo.

## Dos cosas que salieron mal y se corrigieron

1. **El rotulo decia "40 FUENTES EN TRES CAPAS"**, sumando estudios y
   constantes. Una constante del producto no es una fuente. Ahora enumera lo
   que hay: "20 estudios · 21 constantes · tus numeros".
2. **La capa se rotulaba "NIVEL 1"**, y "nivel" ya significa el grado de
   evidencia A/B/C. Dos escalas distintas con el mismo nombre en la misma
   pantalla. Pasa a "CAPA 1".

La incertidumbre creciente se dice **en palabras**, en el pie de cada capa
("Hablan de poblaciones, no de ti" / "mas discutibles" / "la mas cercana y la
mas incierta"), y el color solo acompana. Un degradado de verde a ambar sin
texto habria que aprenderlo, y se pierde para quien no distingue esos tonos.

## Un arreglo de frontera servidor/cliente

`formatValue` vivia en `src/server/tools/evidence.ts`, que importa el cliente
de Supabase de servidor. La pantalla lo necesita en el cliente, y compilaba
**solo porque el tree-shaking quitaba esa dependencia**: por suerte, no por
diseno. Movido a `src/lib/evidence/format-value.ts`, un modulo puro, con
reexport para no romper a quien ya lo importaba.

## Verificacion

- 390 y 1440: titular, las tres capas, la marca de criterio de la app, los
  objetivos del usuario y el detalle desplegable. Sin desborde horizontal.
- Datos reales en pantalla: PMID 41343037, poblacion "67 estudios, 2058
  participantes, 79.1 % hombres, edad media 25.2 anos" y sus limitaciones.
- `navigation.test.ts` fallo por el sexto destino y se actualizo con el motivo:
  ahora afirma los SEIS del conmutador del prototipo, en su orden.
- `tsc`, `eslint`, `next build` limpios. 448 pruebas unitarias. E2E 4/4.
