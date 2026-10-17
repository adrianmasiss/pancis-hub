# El riel como isla y la barra superior

**Fecha**: 2026-09-20

## Lo construido

**El riel deja de ser un panel pegado al borde** y pasa a ser la darsena
flotante del prototipo: dos islas sobre el lienzo, con la receta y las medidas
del handoff extraidas del artefacto, no estimadas de la captura.

```
alto de item   44px   (40 bajo 760px de alto, 34 bajo 620)
separacion     11px
relleno        8px
isla           sidebar oscurecido 8% contra negro
               filete en tinta al 8%, luz interior, sombra tendida
radio          9999px con iconos -> 26px desplegado
item           9999px -> 15px, transicion 300ms cubic-bezier(.22,.61,.36,1)
```

La marca sale de la isla, como en el prototipo: el logotipo ya lleva el nombre.
La primera isla abraza los destinos; la segunda, anclada al pie, lleva el pin y
la cuenta — no son destinos, son controles del propio riel.

**La barra superior se monta por fin.** `TopBar` existia y nadie la usaba, y
con ella se habian perdido las dos funciones que contiene: **no habia forma de
cambiar de tema ni de abrir el asistente desde la interfaz**. Ahora lleva el
conmutador de tema y el acceso al asistente, alineados a la derecha y
respetando el pasillo del copiloto.

La marca solo aparece en la barra en telefono: en escritorio ya la lleva el
riel, y repetirla era decir lo mismo dos veces en la misma pantalla.

## Dos correcciones sobre lo que sali primero

1. **El radio de la isla colgaba del pin.** A 1440px sin haber tocado el pin,
   el riel esta desplegado por punto de corte pero `data-rail` no existe, asi
   que la isla se quedaba en pastilla alrededor de rotulos de texto. Atado al
   punto de corte, con `data-rail` sobrescribiendo — la misma cascada que ya
   usaban el rotulo y las piezas que cambian de forma.

2. **La isla se estiraba al alto completo.** `flex-1` dejaba medio panel oscuro
   vacio debajo de Configuracion. Ahora abraza sus destinos y el hueco que
   sobra es lienzo.

## Estado de los huerfanos

De los cuatro componentes del shell que existian sin montarse, quedan cero:

| Componente | Antes | Ahora |
| --- | --- | --- |
| `UserMenu` | 0 usos | pie del riel |
| `TopBar` | 0 usos | montada en `AppShell` |
| `ThemeToggle` | solo dentro de TopBar | vive y se usa |
| `AssistantFab` | 0 usos | sigue sin montar (su acceso vive en la barra) |

`AssistantFab` se queda fuera a proposito: el acceso al asistente ya esta en la
barra superior, y dos accesos permanentes a lo mismo en la misma pantalla es
ruido. El pasillo de 74px sigue implementado por si vuelve.

## Verificacion

- 390 / 834 / 1440: dos islas, conmutador de tema y acceso al asistente en las
  tres, sin desborde horizontal.
- Radio de la isla: pastilla en telefono y tablet, 26px en escritorio.
- `tsc`, `eslint`, `next build` limpios. 446 pruebas unitarias. E2E 4/4.

---

## Continuacion: fondo ambiental y rotulo del rango

**El fondo ambiental del handoff.** Tres degradados radiales fijos detras de
todo, respirando en un ciclo de 14 s. Sin ellos el casi negro se ve correcto
pero muerto.

Dos apartes del prototipo, los dos por accesibilidad:

- El prototipo anima `transform: scale()` sobre una capa a pantalla completa.
  Un objeto grande moviendose por todo el viewport es de lo que mas dispara el
  mareo, asi que aqui solo respira la opacidad.
- El ciclo de 14 s (~0,07 Hz) queda por debajo del umbral de 0,2 Hz asociado a
  molestia, asi que se conserva. Con `prefers-reduced-motion` se para y se
  queda fijo.

Costo un ajuste: sali primero derivando la mancha fria de `--pc-card` crudo,
que en Gilded ya es oscuro, y mezclado contra `transparent` no levantaba nada
sobre el casi negro. Ahora sale del color de tarjeta **aclarado**, que sigue a
la paleta y si se ve.

**El rotulo "EL DIA"** pasa a la izquierda del segmentado, como el prototipo:
nombra el eje que el segmentado recorre. Encima parecia un titulo de seccion
mas. En telefono se oculta, que es donde no hay ancho para ponerlo al lado.

## Verificacion

- 390 / 834 / 1440: sin desborde; isla en pastilla en telefono y tablet, 26 px
  en escritorio.
- `tsc`, `eslint`, `next build` limpios. 446 pruebas unitarias. E2E 4/4.
