# El anillo de Evidencia, y por que los modelos 3D no sirven

**Fecha**: 2026-09-21

## Los activos de `~/Downloads/3D elements` no pueden mover el mapa muscular

Inspeccionados los cuatro:

| Archivo | Veredicto |
| --- | --- |
| `muscle_body.glb` (13,9 MB) | 347.602 vertices, 521.396 triangulos. **6 objetos con nombres genericos** (`Object_0`…`Object_5`), 1 material, 0 texturas, atributos solo `POSITION` y `NORMAL` (sin UV, asi que tampoco se puede texturizar). |
| `FREE Male Basemesh Anatomy.fbx` | **0 coincidencias** de pectoral, deltoides, biceps, triceps, cuadriceps, gluteo, dorsal, trapecio, gastrocnemio. |
| `male body.fbx` | **0 coincidencias**, igual. |
| `Meshy_AI_..._texture.dxf` (15,4 MB) | DXF es formato CAD. No es una textura utilizable en web. |

**Ninguno tiene musculos con nombre.** Y el mapa muscular del handoff existe
para una cosa concreta: "sustituir un ejercicio recalcula los musculos
implicados y lo refleja en el mapa". Con seis trozos anonimos no hay nada que
resaltar. Con estos activos la pieza seria decoracion de 14 MB en una PWA que
se usa de pie en un gimnasio.

## Y resulta que el handoff no necesita ningun modelo

`muscle-3d.js` **no carga nada**: `grep` de `GLTFLoader|FBXLoader|.glb|.gltf|.fbx`
da 0. Construye el cuerpo procedimentalmente con `LatheGeometry` y
`SphereGeometry`, y pinta los musculos como parches con nombre sobre esas
superficies:

```js
patch(TORSO, 'pectoral',      1.338, 1.412, s * 0.62, 0.46, 0.10, trunk, 0.45);
patch(ARM,   'deltoides',     1.356, 1.478, s * 0.42, 0.68, 0.12, arm,   0.5);
patch(ARM,   'deltoides-post',1.360, 1.476, s * 2.84, 0.78, 0.10, arm,   0.5);
```

Con un prop `highlight: {"pectoral":1,"triceps":0.5}` — 1 principal, 0.5
asistente. Eso SI hace el trabajo, y pesa cero bytes de activo. Lo que le falta
al repo es la dependencia `three`, que no esta instalada.

Conclusion: los modelos son un camino equivocado, no un activo que aprovechar.

## El anillo, en cambio, no necesitaba nada

`THREE` aparece **0 veces** en el prototipo principal: el anillo es CSS 3D
(`preserve-3d`, `perspective`, `rotateY`, `translateZ`). Construido con su
geometria literal:

```
translateX(off * 232px)  translateZ(-|off| * 190px)
rotateY(-off * 34deg)    scale(1 - |off| * 0.06)
opacidad 1 - |off| * 0.26, oculto a partir de |off| > 2.5
transicion 720ms cubic-bezier(0.22, 0.75, 0.28, 1)
```

Cero dependencias, cero MB.

**No gira solo.** El README dice que gira y se pausa al pasar el raton; el
prototipo lo mueve al pulsar, y esa version es la buena: perseguir con el
cursor algo que se mueve para poder pulsarlo es hostil, y una rotacion
permanente es justo lo que `prefers-reduced-motion` existe para apagar. Se
recorre con dos flechas y con teclado, y los lomos ocultos salen del orden de
tabulacion.

## La regla de seleccion esta escrita, no es gusto

El anillo no puede mostrar las 41 entradas. La regla vive en la consulta y en
un pie visible: **los tres de mayor grado de cada una de las dos primeras capas
y tus numeros al final**; empatados gana el mas reciente. Que sean tres y tres
y uno hace que las tres capas aparezcan siempre — con "los siete mas fuertes" a
secas, la capa de interpretacion podia no salir nunca.

Un criterio del producto (`is_product_parameter`) no entra a representar la
capa de interpretacion: no es una lectura de la evidencia. Y una lectura nunca
se muestra mas cierta que la evidencia que la sostiene: su certeza es la del
grado menos uno.

## Verificacion

- 390 y 1440: siete lomos, las tres capas presentes, la navegacion avanza,
  sin desborde horizontal.
- El titulo del lomo se recorta: sin eso, un titulo largo se salia de la
  tarjeta y empujaba la referencia fuera. El completo esta en la tabla.
- `tsc`, `eslint`, `next build` limpios. 448 unitarias. E2E 21/21.
