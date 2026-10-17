# Verificación nutricional del catálogo

> 13 de octubre de 2026 · reproducible con `npm run verificar`
> (`scripts/verificar-nutricion.mjs`). Sólo lee: no corrige nada.

## La pregunta

¿Los alimentos aportan de verdad lo que la app dice? Se responde con tres
pruebas sobre datos reales, no con una muestra elegida a mano:

- **A. Coherencia interna**, sobre los 28.140 alimentos: la energía declarada
  tiene que salir de los macros (4 kcal/g de proteína y carbohidrato, 9 de
  grasa, factores de Atwater). Tolerancia amplia —20 % y al menos 20 kcal—
  porque USDA usa factores propios por alimento, la fibra aporta menos de 4 y
  el alcohol 7. También se marcan los imposibles: más de 900 kcal o más de
  100 g de macros por 100 g.
- **B. Contraste con una tabla oficial**: la _Tabla de Composición de
  Alimentos de Centroamérica_ (INCAP/OPS, 2.ª ed., 3.ª reimpresión, 2012),
  en 46 pares de alimentos básicos de aquí, incluidos los 13 de la dieta de
  demostración que tienen equivalente en la tabla. Coinciden si las kcal
  difieren ≤ 10 % y cada macro ≤ 2 g (o ≤ 10 % si el valor es grande).
- **C. Productos de Costa Rica** (código de barras 744, de Open Food Facts):
  la prueba A sobre lo que la comunidad copió de las etiquetas.

## Resultados

### A. Coherencia energía/macros

| Fuente                  | Alimentos | Marcados |     % |
| ----------------------- | --------: | -------: | ----: |
| Datos de demostración   |        22 |        0 | 0,0 % |
| USDA genéricos          |    11.989 |      207 | 1,7 % |
| USDA productos de marca |    15.084 |      509 | 3,4 % |
| Open Food Facts         |     1.045 |      103 | 9,9 % |

Lo que significa cada fila:

- **USDA genéricos: casi todo es método, no error.** Los marcados son bebidas
  alcohólicas (el alcohol aporta 7 kcal/g y no está entre los macros), salvado
  y especias (mucha fibra, que aporta menos de 4 kcal/g) y edulcorantes como el
  monk fruit (carbohidrato que no se absorbe). Son datos de laboratorio
  correctos que la regla general no describe bien.
- **USDA de marca: 159 imposibles.** Por ejemplo, un aceite a 929 kcal/100 g
  (el máximo físico es 900) o una bebida de almendra a 12,5 kcal con 8,3 g de
  grasa (eso solo ya son 75 kcal). Son errores de la etiqueta que USDA
  recibió del fabricante.
- **Open Food Facts: 1 de cada 10 tiene una cifra mal copiada.** Ver C.

### B. Contra INCAP: 33 de 46 pares coinciden

| Alimento en Pancis                                                        | Fuente       | kcal Pancis | INCAP (código)                                           | kcal INCAP | Δ kcal | Δ P / G / C (g)     |     |
| ------------------------------------------------------------------------- | ------------ | ----------: | -------------------------------------------------------- | ---------: | -----: | ------------------- | --- |
| Hearts of palm, raw                                                       | USDA         |         115 | Palmito sin corteza (11125)                              |         26 | +342 % | +0.5 / +0.0 / +20.4 | ✗   |
| Chayote, crudo                                                            | USDA         |          19 | Chayote crudo (11047)                                    |         31 |  -39 % | -0.1 / -0.1 / -3.2  | ✗   |
| Guayaba, cruda                                                            | USDA         |          68 | Guayaba madura (12052)                                   |         51 |  +33 % | +1.8 / +0.4 / +2.4  | ✗   |
| Tortilla de maiz                                                          | Demostración |         218 | Tortilla de maíz blanco, Costa Rica, casera (14074)      |        175 |  +25 % | +0.9 / +2.2 / +1.2  | ✗   |
| Camote                                                                    | Demostración |          90 | Camote anaranjado cocido, sin cáscara, sin sal (11034)   |         76 |  +18 % | +0.6 / +0.1 / +3.3  | ✗   |
| Malanga (taro), cruda                                                     | USDA         |         112 | Malanga/otoe, raíz cruda (11112)                         |        132 |  -15 % | -0.2 / -0.1 / -4.4  | ✗   |
| Plátano verde, crudo                                                      | USDA         |         152 | Plátano verde (12131)                                    |        132 |  +15 % | +0.1 / +0.0 / +1.4  | ✗   |
| Tortillas, de maíz                                                        | USDA         |         218 | Tortilla de maíz blanco, Costa Rica, industrial (14075)  |        193 |  +13 % | +0.6 / +1.8 / -3.1  | ✗   |
| Papaya, cruda                                                             | USDA         |          43 | Papaya madura, pulpa (12112)                             |         39 |  +10 % | -0.1 / +0.2 / +1.0  | ✗   |
| Atun en agua                                                              | Demostración |         116 | Atún enlatado en agua, sólidos (8020)                    |        128 |   -9 % | +2.4 / -2.0 / +0.0  | ✗   |
| Cereals, oats, regular and quick, not fortified, dry                      | USDA         |         379 | Avena en hojuelas sin fortificar (13008)                 |        389 |   -3 % | -3.7 / -0.4 / +1.4  | ✗   |
| Pan integral                                                              | Demostración |         247 | Pan integral, de rodaja, suave (14040)                   |        246 |   +0 % | +3.3 / -0.8 / -5.1  | ✗   |
| Almendras                                                                 | Demostración |         579 | Almendra, seca (10001)                                   |        581 |   -0 % | -0.9 / -0.6 / +2.1  | ✗   |
| Pollo, pechuga, solo carne, cocido, asado                                 | USDA         |         165 | Pollo, pechuga sin piel, cocida (3039)                   |        151 |   +9 % | +2.0 / +0.6 / +0.0  | ✓   |
| Pechuga de pollo                                                          | Demostración |         165 | Pollo, pechuga sin piel, cocida (3039)                   |        151 |   +9 % | +2.0 / +0.6 / +0.0  | ✓   |
| Brócoli, crudo                                                            | USDA         |          31 | Brócoli crudo (11027)                                    |         34 |   -9 % | -0.2 / -0.1 / -0.3  | ✓   |
| Pollo, muslo, solo carne, cocido, asado                                   | USDA         |         179 | Pollo, muslo sin piel, cocido (3036)                     |        195 |   -8 % | -0.2 / -1.6 / +0.0  | ✓   |
| Repollo, crudo                                                            | USDA         |          25 | Repollo común, crudo (11150)                             |         24 |   +4 % | +0.1 / -0.1 / +0.4  | ✓   |
| Piña cruda, todas las variedades                                          | USDA         |          50 | Piña, toda variedad (12159)                              |         48 |   +4 % | -0.0 / -0.0 / +0.5  | ✓   |
| Huevo entero, crudo, fresco                                               | USDA         |         143 | Huevo de gallina, entero, crudo (2002)                   |        147 |   -3 % | +0.0 / -0.4 / -0.1  | ✓   |
| Mango, crudo                                                              | USDA         |          60 | Mango maduro (12080)                                     |         59 |   +2 % | +0.3 / +0.2 / -0.4  | ✓   |
| Arroz blanco                                                              | Demostración |         365 | Arroz blanco, pulido, enriquecido (13002)                |        360 |   +1 % | +0.5 / +0.1 / +0.7  | ✓   |
| Azúcar blanca                                                             | USDA         |         385 | Azúcar blanca, granulada (15001)                         |        384 |   +0 % | +0.0 / +0.3 / +0.5  | ✓   |
| Leche entera, 3,25 % de grasa, con vitamina D añadida                     | USDA         |          60 | Leche de vaca, íntegra, fluida (3,25 % grasa) (1015)     |         60 |   +0 % | +0.1 / -0.0 / +0.1  | ✓   |
| Leche semidescremada, líquida, 2 % de grasa, con vitaminas A y D añadidas | USDA         |          50 | Leche de vaca, semidescremada (2 % grasa), fluida (1010) |         50 |   +0 % | +0.1 / -0.1 / +0.2  | ✓   |
| Queso fresco                                                              | Demostración |         264 | Queso blanco fresco, leche íntegra (1029)                |        264 |   +0 % | +0.5 / -0.1 / +0.1  | ✓   |
| Clara de huevo, cruda, fresca                                             | USDA         |          52 | Huevo de gallina, clara fresca (2004)                    |         52 |   +0 % | +0.0 / +0.0 / -0.0  | ✓   |
| Clara de huevo                                                            | Demostración |          52 | Huevo de gallina, clara fresca (2004)                    |         52 |   +0 % | +0.1 / +0.0 / -0.0  | ✓   |
| Huevo entero                                                              | Demostración |         155 | Huevos, cocidos o duros (21038)                          |        155 |   +0 % | +0.4 / +0.4 / -0.0  | ✓   |
| Pollo, solo carne, crudo                                                  | USDA         |         119 | Pollo, carne sin piel, cruda (3023)                      |        119 |   +0 % | +0.0 / +0.0 / +0.0  | ✓   |
| Pollo, pechuga, carne y piel, crudo                                       | USDA         |         172 | Pollo, pechuga con piel, cruda (3038)                    |        172 |   +0 % | -0.1 / +0.1 / +0.0  | ✓   |
| Frijoles rojos, rojos, grano seco, cocidos, hervidos, sin sal             | USDA         |         127 | Frijol rojo, cocido sin sal (9035)                       |        127 |   +0 % | +0.0 / +0.0 / +0.0  | ✓   |
| Avocados, raw, all commercial varieties                                   | USDA         |         160 | Aguacate (11005)                                         |        160 |   +0 % | +0.0 / +0.0 / -0.0  | ✓   |
| Aguacate                                                                  | Demostración |         160 | Aguacate (11005)                                         |        160 |   +0 % | +0.0 / +0.0 / -0.0  | ✓   |
| Brocoli                                                                   | Demostración |          35 | Brócoli cocido sin sal, escurrido (11028)                |         35 |   +0 % | +0.0 / -0.0 / +0.0  | ✓   |
| Chayote, cocido, hervido, escurrido, sin sal                              | USDA         |          24 | Chayote cocido sin sal, escurrido (11048)                |         24 |   +0 % | -0.0 / +0.0 / +0.0  | ✓   |
| Vainicas, verdes, crudas                                                  | USDA         |          31 | Ejotes/vainicas, crudos (11071)                          |         31 |   +0 % | -0.0 / +0.1 / -0.1  | ✓   |
| Camote, cocido, hervido, sin piel                                         | USDA         |          76 | Camote anaranjado cocido, sin cáscara, sin sal (11034)   |         76 |   +0 % | +0.0 / -0.0 / -0.0  | ✓   |
| Elote, amarillo, crudo                                                    | USDA         |          86 | Elote, amarillo dulce, crudo (11075)                     |         86 |   +0 % | +0.1 / +0.2 / -0.3  | ✓   |
| Yuca cruda                                                                | USDA         |         160 | Yuca o mandioca, raíz (11167)                            |        160 |   +0 % | +0.0 / +0.0 / +0.0  | ✓   |
| Banano, crudo                                                             | USDA         |          89 | Banano/guineo, maduro (12010)                            |         89 |   +0 % | +0.0 / -0.0 / -0.0  | ✓   |
| Banano                                                                    | Demostración |          89 | Banano/guineo, maduro (12010)                            |         89 |   +0 % | +0.0 / -0.0 / +0.2  | ✓   |
| Plátano maduro, crudo                                                     | USDA         |         122 | Plátano maduro (12130)                                   |        122 |   +0 % | +0.0 / +0.0 / +0.0  | ✓   |
| Sandía, cruda                                                             | USDA         |          30 | Sandía (12134)                                           |         30 |   +0 % | -0.0 / +0.1 / +0.0  | ✓   |
| Manzana                                                                   | Demostración |          52 | Manzana importada, con cáscara (12086)                   |         52 |   +0 % | +0.0 / +0.0 / +0.2  | ✓   |
| Avena en hojuelas                                                         | Demostración |         389 | Avena en hojuelas sin fortificar (13008)                 |        389 |   +0 % | +0.0 / +0.0 / -0.3  | ✓   |

Lectura de los 13 que no coinciden:

1. **Tortilla de maíz de la dieta de demostración: 218 kcal frente a 175.** Es
   el hallazgo que más pesa, porque se come a diario. El valor de la
   demostración es el de una tortilla industrial estadounidense (USDA); INCAP
   midió la **tortilla casera de Costa Rica en 175 kcal** y la industrial tica
   en 193. Con tres tortillas al día (≈ 90 g) la diferencia es de ~40 kcal.
2. **Palmito: 115 frente a 26 kcal.** No es un error de nadie: son dos
   productos distintos. «Hearts of palm, raw» de USDA es el cogollo fresco de
   otra palmera; el palmito sin corteza de INCAP es el que se come aquí. Por
   eso este alimento **no se tradujo**: llamarlo «Palmito» haría pasar uno
   por el otro.
3. **Frutas y raíces tropicales (chayote, guayaba, malanga, plátano verde,
   papaya): diferencias del 10 al 39 %.** Variedad, suelo y madurez. INCAP
   analizó variedades centroamericanas; USDA, las que llegan a EE. UU. Para
   quien vive en Costa Rica, INCAP es la referencia más cercana.
4. **Camote de la demostración: 90 frente a 76 kcal.** Distinta preparación:
   el valor de la demostración es horneado con cáscara; el de INCAP, hervido
   sin cáscara.
5. **Atún, avena, pan integral y almendras:** kcal dentro del 10 %, pero un
   macro difiere más de 2 g (p. ej., 3,7 g de proteína en la avena). Diferencia
   de marca o de análisis; no cambia una dieta.

Advertencia sobre la independencia: INCAP toma parte de sus valores de USDA
SR18 (lo dice su bibliografía). En leche, huevo y pollo el acuerdo es
esperable y confirma menos de lo que parece; en tortilla, chayote, yuca y
plátano INCAP trae análisis propios, y ahí es donde aparecen las diferencias.

### C. Productos de Costa Rica (744): 58 de 508 marcados (11,4 %)

Ejemplos reales del catálogo:

| Producto                 |  Declara | Sus macros dan | Lo probable                             |
| ------------------------ | -------: | -------------: | --------------------------------------- |
| Leche semidescremada     |   7 kcal |        50 kcal | falta un dígito o es otra casilla       |
| Consomé de costilla      | 160 kcal |        15 kcal | valor del polvo, no del preparado       |
| Jamón de pechuga de pavo | 450 kcal |       103 kcal | kJ copiados como kcal o error de dígito |
| Aderezo mostaza miel     |   0 kcal |        93 kcal | casilla de energía vacía                |
| Yogurt semidescremado    | 123 kcal |        80 kcal | valor por porción                       |

**Lo que esta prueba no ve:** si alguien copió _las tres_ cifras por porción
en la casilla de 100 g, los números son coherentes entre sí y pasan. Es el
caso de «Leche Dos Pinos» a 125 kcal/100 ml, coherente con sus 8 / 12 / 5 g
pero el doble de lo que tiene una leche entera (≈ 60). Para eso hace falta la
prueba B por categoría, que es el siguiente paso natural.

## Qué cambia en la app

Nada todavía: la verificación sólo lee. Las acciones posibles, por orden de
impacto:

1. **Avisar en la ficha** cuando un alimento no pasa la prueba A («las cifras
   de esta etiqueta no cuadran entre sí»), en lugar de esconderlo.
2. **Usar INCAP para los alimentos centroamericanos** (tortilla tica,
   chayote, yuca, plátano, pejibaye…) como fuente propia, con su código.
3. **Corregir la tortilla de la demostración** a la de INCAP.

## Fuentes

- INCAP/OPS. _Tabla de Composición de Alimentos de Centroamérica_, 2.ª ed.,
  Menchú MT, Méndez H (eds.), 2007; 3.ª reimpresión, 2012. ISBN
  99922-880-2-7. Copia consultada:
  [portalacademico.cch.unam.mx](https://portalacademico.cch.unam.mx/materiales/prof/matdidac/sitpro/exp/quim/quim2/quimIIvallejo/TCA.pdf).
- USDA FoodData Central (Foundation, SR Legacy, FNDDS y Branded), tal como
  está sembrado en el catálogo.
- Open Food Facts (ODbL), productos con código 744.
