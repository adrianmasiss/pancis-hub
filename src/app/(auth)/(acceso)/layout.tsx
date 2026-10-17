import { CON_SELECTOR } from "@/features/auth/fondos-guion";
import { BackgroundSwitcher } from "@/features/auth/components/background-switcher";
import { LoginStage } from "@/features/auth/components/login-stage";
import { NewtonsCradle } from "@/components/shared/newtons-cradle";
import { BrandLogo } from "@/components/shared/brand-logo";

/**
 * El escenario de acceso vive AQUI, en el layout, y no en cada pagina.
 *
 * Es lo que arregla el motivo por el que la introduccion se repetia: con el
 * escenario dentro de `login/page.tsx` y `registro/page.tsx`, alternar entre
 * los dos desmontaba el componente, el estado `ready` se perdia y las
 * animaciones de entrada volvian a arrancar desde cero. En un layout
 * compartido el arbol persiste entre rutas hermanas: al alternar solo cambian
 * los hijos, asi que la introduccion se ve una vez —al llegar— y el cambio de
 * metodo es una transicion de la tarjeta.
 *
 * El grupo `(acceso)` no aparece en la URL: `/login` y `/registro` siguen
 * siendo `/login` y `/registro`. Y queda fuera Recuperar y Nueva contrasena,
 * que son tarjetas de una columna y no llevan escenario.
 */

export default function AccesoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* La foto del fondo se descubre al analizar el CSS, es decir tarde.
          Precargarla adelanta el primer pintado de la pantalla de entrada,
          que es justo donde una espera se nota mas. Apunta al valor por
          omision del CSS; con el selector abierto y otro fondo elegido la
          precarga se desperdicia, y eso solo pasa en desarrollo. */}
      <link
        rel="preload"
        as="image"
        href="/acceso/fondos/00-actual.webp"
        type="image/webp"
      />
      <LoginStage>{children}</LoginStage>
      {/* La pantalla de carga del ENVIO, uno de los candidatos del selector.

          Va AQUI y no dentro del escenario por una razon medida: `.login-stage`
          lleva `isolation: isolate`, asi que es un contexto de apilado y
          cualquier `z-index` de dentro se queda dentro —la capa tapaba la
          tarjeta pero el aviso legal, que es hermano del escenario y va con
          `z-index: 3`, se seguia leyendo encima—. Como hermana, compite de tu
          a tu con el aviso.

          La enciende el CSS, no React: `html[data-carga-envio="pantalla"]` mas
          un `:has()` sobre el boton que ya lleva `aria-busy`. Asi el camino
          del envio no cambia ni una linea para poder mirarlo. */}
      {CON_SELECTOR ? (
        <div className="login-sending" aria-hidden="true">
          <BrandLogo variant="mark" height={86} />
          <BrandLogo variant="name" height={45} />
          <NewtonsCradle size={44} />
        </div>
      ) : null}
      {CON_SELECTOR ? <BackgroundSwitcher /> : null}
    </>
  );
}
