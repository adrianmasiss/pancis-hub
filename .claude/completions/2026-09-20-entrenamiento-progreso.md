# Fase 5b: Entrenamiento y Progreso

**Fecha**: 2026-09-20
**Fase**: 5 de la implementacion de `desing-reference/`

## El punto de partida

Ninguna de las dos pantallas tenia **una sola clase de punto de corte**. Eran
una columna unica, identica a 390px y a 1440px: en escritorio, cada seccion una
franja de 1100px con una lista corta dentro.

## El fallo: Progreso rodaba de lado en telefono

`documentElement.scrollWidth` daba 480 en una ventana de 390. Noventa pixeles
de desplazamiento horizontal en la pantalla principal del producto.

Costo encontrarlo porque **ningun elemento se salia de su caja**. La tabla de
mediciones (520px) ya vivia dentro de un contenedor con `overflow-x: auto`, y
la cadena de ancestros medida hasta `body` estaba toda a 390.

La causa: dentro del boton Editar de cada fila hay un
`<span className="sr-only">`. Tailwind implementa `sr-only` con
`position: absolute`. Un descendiente absoluto **no lo recorta** un contenedor
con `overflow` salvo que ese contenedor sea su bloque contenedor — y el div de
la tabla no estaba posicionado. Asi que el span escapaba del recorte, aterrizaba
en su posicion estatica dentro de la tabla de 520px, y empujaba el lienzo.

Arreglo: `relative` en el contenedor con scroll. Una palabra.

Verificado en las cuatro rutas: `scrollWidth` 390 en las cuatro.

Vale la pena registrarlo porque la trampa es general: **cualquier `sr-only`
dentro de un contenedor con scroll horizontal lo rompe si el contenedor no es
`relative`**, y no se ve mirando el marcado.

## La columna estirada

Emparejadas las secciones que son bloques independientes, no una secuencia:

- **Entrenamiento**: Historial, Mejores marcas y Series por musculo pasan a
  rejilla de dos columnas desde `lg`. Rutinas se queda a ancho completo: es la
  accion principal.
- **Progreso**: Bienestar y Fotos en paralelo desde `md`. No se leen en
  secuencia, asi que apilarlas a ancho completo solo alargaba la pagina.

No se aplico rejilla a los datos secuenciales: el historial de mediciones sigue
siendo una tabla y las series siguen siendo listas, como manda DESIGN.md.

## Verificacion

- 390 / 1440 en ambas rutas, sin desborde horizontal en ninguna.
- `tsc`, `eslint`, `next build` limpios. 446 pruebas unitarias. E2E 4/4.
