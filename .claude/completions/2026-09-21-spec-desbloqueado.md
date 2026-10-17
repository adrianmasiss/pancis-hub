# El spec ciego: de 1 prueba a 21

**Fecha**: 2026-09-21

`e2e/flujo-minimo.spec.ts` fallaba en su segunda prueba y, por ser serial,
arrastraba 15 mas. La suite completa corria 6 de 21. Llevaba asi desde antes de
esta sesion.

## Lo que el spec estaba reportando no era un localizador roto

Buscaba un boton "Agregar alimento" que no existia **porque la funcion no
existia**: `/nutricion` pedia `getDayPlan` —que trae `plan.meals`, las comidas
registradas— y **usaba solo sus totales**. Las comidas se consultaban y se
tiraban.

Consecuencia: "Agregar comida" creaba algo invisible. No habia forma de verlo,
de anadirle alimentos ni de corregirlo. `MealCard`, `MealItemRow` y
`FoodPicker` existian sin montarse — tres huerfanos mas, del mismo rediseno que
dejo huerfanos a `TopBar`, `ThemeToggle`, `UserMenu` y `AssistantFab`.

Arreglo: la seccion "Lo que registraste hoy", debajo del plan. Al entrar la
pregunta es "que me toca"; "que comi" es la segunda.

## Una inconsistencia que yo habia introducido

Al meter el veredicto de sustitucion renombre `swap.confirmSwap` de "Confirmar
intercambio" a "Ver el cambio". Ese rotulo lo comparten **las dos** hojas de
sustitucion, y solo una recibio el paso de veredicto. Asi que en la hoja de las
comidas registradas el boton decia "ver" y aplicaba directo.

Se arreglo dandole el mismo veredicto, no revirtiendo el rotulo: el paso de dos
gestos es la regla del producto —proponer, no ejecutar— y vale igual ahi.

## Dos flakes latentes que el desbloqueo revelo

Ninguna de estas pruebas se habia ejecutado nunca, asi que sus carreras estaban
escondidas:

1. **El margen por macro.** `fill("12")` sobre un `input[type=number]`
   controlado, antes de hidratar, dejaba `"512"` — y la validacion lo rechazaba
   con razon. Fallaba por una carrera, no por la funcion.
2. **El cambio de objetivo.** `selectOption` sobre un `select` controlado, con
   la misma carrera. Esta paso una vez y fallo la siguiente con el mismo
   codigo.

En los dos casos se espera a que el campo traiga SU valor —prueba de que React
ya tomo el control— y se afirma el valor despues de escribirlo. Un fallo
intermitente pasa a ser un fallo inmediato y en el sitio correcto.

## Tres pruebas actualizadas porque la decision cambio, no para que pasaran

- **El intercambio son dos gestos.** Afirma que aparecen el veredicto y el
  efecto en el dia antes de aplicar.
- **El acceso al asistente es la barra superior**, no un flotante. El flotante
  desaparecia en Hoy y en el propio asistente, asi que "desde cualquier
  pantalla" no era cierto; la barra si lo cumple.
- **La respuesta ya no rotula sus seis secciones.** Se afirma sobre el
  desplegable "¿Por que?" y su contenido, que es lo que garantiza que la
  respuesta llego con fundamento y no solo con una frase.

## Estado

```
e2e          21/21   (era 6/21)
unitarias    448/448
tsc · eslint · build   limpios
```
