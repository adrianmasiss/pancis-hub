"use client";

import { useEffect, useState, ViewTransition, type ReactNode } from "react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { NewtonsCradle } from "@/components/shared/newtons-cradle";
import { messages } from "@/i18n/es-419";

/**
 * El escenario de acceso: la entrada de marca y la tarjeta que la recibe.
 *
 * Vive en el layout del grupo `(acceso)`, asi que persiste entre `/login` y
 * `/registro`. De eso dependen las dos cosas que pidio el usuario:
 *
 *  - La ENTRADA se ve una sola vez, al llegar. Antes el escenario estaba en
 *    cada pagina: alternar de metodo lo desmontaba, `ready` se perdia y toda
 *    la introduccion volvia a arrancar. Ahora el componente no se desmonta y
 *    las animaciones no tienen como reiniciarse.
 *  - El CAMBIO de metodo es una transicion de la tarjeta entera. La tarjeta
 *    lleva `name`, asi que el navegador interpola su caja entre el alto de un
 *    formulario y el del otro, y cruza sus contenidos por dentro.
 *
 * La animacion de CARGA no se toca aqui: la de arranque es la barra de esta
 * introduccion, y la de enviar vive en el boton de cada formulario. Cambiar
 * de metodo no es cargar nada, y por eso no muestra ninguna.
 */
export function LoginStage({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const t = messages.auth;

  /* "Repetir intro" del selector de fondos (solo en desarrollo).
     `pase` es la vuelta: se usa como `key` de las piezas que animan, asi que
     subirlo las remonta y sus animaciones arrancan de cero.

     Volver a `ready: false` NO basta, y esto se comprobo: aunque el CSS las
     apaga con `[data-ready] { animation: none }`, quitar el atributo no
     relanza una animacion que ya termino —medido a 900ms de la repeticion, el
     fondo de la carga seguia en `opacity: 0` y la marca en su sitio del
     login—. Remontar si, porque el elemento es otro. */
  const [pase, setPase] = useState(0);
  useEffect(() => {
    const repetir = () => {
      setReady(false);
      setPase((vuelta) => vuelta + 1);
    };
    window.addEventListener("pancis:repetir-intro", repetir);
    return () => window.removeEventListener("pancis:repetir-intro", repetir);
  }, []);

  return (
    <div className="auth-stage login-stage" data-ready={ready || undefined}>
      <header
        key={`nombre-${pase}`}
        className="login-brand-name"
        aria-label={messages.app.name}
      >
        <BrandLogo variant="name" height={45} />
        <p>{t.stage.tagline}</p>
      </header>

      <div
        key={`marca-${pase}`}
        className="login-floating-mark"
        aria-hidden="true"
      >
        <BrandLogo variant="mark" height={86} />
      </div>

      {/* El fondo de la CARGA, solo durante la carga: la malla gris que
          mando el usuario. Se funde con la foto del gimnasio en el mismo
          tramo en que la marca viaja a su sitio, asi que el cambio de fondo
          y el cambio de pantalla son un solo gesto y no dos. */}
      <div
        key={`carga-${pase}`}
        className="login-loading-bg"
        aria-hidden="true"
      />

      {/* Debajo del nombre, y nada mas: el cargador. Sustituye a la barra de
          progreso, que fingia medir algo que nadie mide, y a la frase que
          habia debajo. `role="status"` con su nombre accesible es lo que
          anuncia la espera a un lector de pantalla; los puntos son
          decorativos y el componente ya los marca `aria-hidden`. */}
      <div
        key={`cargador-${pase}`}
        className="login-intro-progress"
        role="status"
        aria-label={messages.common.loading}
        /* Solo la animacion DE ESTA capa cierra la entrada. `animationend`
           burbujea, y las de los puntos del cargador se repiten: sin el
           filtro la entrada se daba por acabada en el primer vaiven. */
        onAnimationEnd={(evento) => {
          if (evento.target === evento.currentTarget) setReady(true);
        }}
      >
        <NewtonsCradle size={44} />
      </div>

      {/* `share="morph"` da a la caja de la tarjeta la clase `morph`, que es
          lo que el CSS usa para ponerle duracion y el desenfoque de media
          vuelta. Sin nombre no habria morfologia: el navegador fundiria la
          pagina entera y la tarjeta daria un salto de alto. */}
      <ViewTransition name="auth-card" share="morph">
        <section
          key={`hoja-${pase}`}
          className="login-sheet"
          aria-label={t.stage.label}
          onFocusCapture={() => setReady(true)}
        >
          {children}
        </section>
      </ViewTransition>
    </div>
  );
}
