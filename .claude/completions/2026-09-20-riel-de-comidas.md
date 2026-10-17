# Fase 4b: el riel de comidas

**Fecha**: 2026-09-20
**Fase**: 4 de la implementacion de `desing-reference/`

## Lo construido

`meal-rail.tsx` — la linea vertical de la que cuelgan las comidas, y
`plan-meal-card.tsx` reescrito como nodo del riel.

### La linea mide energia, no comidas

El relleno es `kcal registradas / kcal del plan`. Contar comidas dejaria la
linea a la mitad con el ochenta por ciento del dia hecho: un desayuno de 520 y
una merienda de 310 no valen lo mismo. Medido: 282 px de 971 con dos de seis
comidas registradas.

### Cada nodo

Plegado dice lo que hace falta para decidir: hora, estado, nombre, de que esta
hecha, su energia y su peso en el dia. La barra de tres segmentos es el
**reparto de energia de esa comida** con la formula del prototipo (proteina y
carbohidrato a 4 kcal/g, grasa a 9); el `% del dia` que va al lado responde la
otra pregunta, cuanto pesa en el conjunto.

El interruptor de confirmacion esta **separado** del boton que despliega, como
pide el handoff: confirmar y mirar son dos intenciones, y juntarlas registra
comidas por querer verlas. La cruz gira hacia el check al pasar por encima y
queda fija en verde una vez registrada, porque desde aqui no se deshace.

## Dos correcciones sobre el prototipo

1. **El relleno del riel es verde, no naranja.** Tal como lo saque primero, la
   linea decia "hecho" en naranja mientras los nodos y los checks lo decian en
   verde: dos codigos de color para un solo estado, en la misma columna. El
   naranja queda para lo pendiente, que es donde hay que actuar.

2. **Una comida sin alimentos ya no se pinta como pura grasa.** La formula del
   prototipo normaliza con `|| 1`; con todo a cero, proteina y carbohidrato
   redondean a 0 % y el resto —el 100 %— caia entero en el segmento de grasas.
   Ahora la barra se queda vacia. El caso sale solo: una comida recien creada
   en el plan todavia no tiene items.

## Verificacion

- 390 / 834 / 1440: seis comidas, sin desborde horizontal, cuatro botones de
  confirmar y seis de desplegar.
- Confirmacion ejercitada desde la interfaz, no simulada: dos comidas marcadas,
  el riel subio y los nodos pasaron a verde.
- Relleno medido en `#46b98a` (`--positive`), 29 % de la pista.
- Comida vacia: cero segmentos de reparto.
- `tsc`, `eslint`, `next build` limpios. 66 pruebas unitarias en 9 archivos.
  `plan-meal-card.test.tsx` sigue pasando: el rotulo accesible del interruptor
  no cambio.

## Datos de prueba

La base local no tenia dieta para el demo, asi que para ver el riel se creo un
usuario **desechable** con el sembrador del e2e:
`riel-1789938010981@pancis.local`. No se toco el usuario demo. Se puede borrar
cuando se quiera; queda junto a los que ya crea el e2e.

Nota: le sembre "Media manana" y "Merienda" como `meal_type: snack` porque la
restriccion de la tabla solo admite desayuno / almuerzo / cena / snack / otro.
Por eso las dos salen a las 16:30 en el riel — es el mapa `MEAL_TIMES`
resolviendo `snack`, no un fallo del componente. Si el handoff quiere cinco
horas distintas, hace falta una hora por comida en la tabla.
