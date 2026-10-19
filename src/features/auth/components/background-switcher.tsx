"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  alternarDieta,
  borrarPlanDeEjemplo,
  estadoDeLaDieta,
  type EstadoDieta,
} from "@/features/nutrition/dieta-demo-actions";
import {
  acentosDelProducto,
  hojaDelAcento,
  ID_HOJA_ACENTO,
  type AcentoCandidato,
} from "../acentos-acceso";
import {
  ATRIBUTO_CARGA_ENVIO,
  cargasDelEnvio,
  CLAVE_CARGA_ENVIO,
  type CargaEnvio,
} from "../cargas-envio";
import {
  fondosDeLaCarga,
  fondosDelLogin,
  type FondoCandidato,
} from "../fondos-acceso";
import {
  acentosDeTarjeta,
  ATRIBUTO_ACENTO_TARJETA,
  CLAVE_ACENTO_TARJETA,
  type AcentoTarjeta,
} from "@/features/nutrition/acentos-tarjeta";
import { CLAVE_FONDO_SISTEMA, VARIABLE_FONDO_SISTEMA } from "../fondos-guion";

/**
 * El selector de fondos: una herramienta para DECIDIR, no una funcion de la
 * app. Solo se monta en desarrollo (o con `NEXT_PUBLIC_FONDOS=1`), asi que no
 * llega a produccion ni por descuido.
 *
 * Como funciona: cada candidato es un valor CSS —una `url()` o un gradiente— y
 * elegirlo lo escribe en una variable de `<html>`:
 *
 *   --login-foto   la foto de fondo del formulario
 *   --login-carga  el fondo de la pantalla de carga
 *
 * El ACENTO va por otro camino, y no por capricho: los tokens de la paleta los
 * escribe el proveedor de tema en linea sobre `<html>`, asi que una variable
 * mas en linea se la lleva por delante el primer cambio de tema. La
 * sustitucion se inyecta como una hoja `!important` —`../acentos-acceso`
 * explica por que— y se guarda igual que los fondos.
 *
 * El CSS las lee con un valor por omision, asi que si esta herramienta no
 * existe la pantalla se ve igual que siempre. Y la eleccion se guarda en
 * `localStorage`, que es lo que la vuelve util: aguanta el recargado, asi que
 * se puede ver la introduccion completa con cada fondo sin volver a elegir.
 *
 * El guion en linea del layout aplica lo guardado ANTES del primer pintado.
 * Sin el, la pantalla de carga —que dura 3s y arranca sola— empezaria con el
 * fondo por omision y cambiaria a mitad, que es justo lo que se quiere juzgar.
 */
const CLAVE = {
  login: "pancis:fondo-login",
  carga: "pancis:fondo-carga",
  sistema: CLAVE_FONDO_SISTEMA,
} as const;

const CLAVE_ACENTO = "pancis:acento";

const VARIABLE = {
  login: "--login-foto",
  carga: "--login-carga",
  sistema: VARIABLE_FONDO_SISTEMA,
} as const;

type Cual = keyof typeof CLAVE;

const FONDOS_PREDETERMINADOS = {
  login: "imagen-4",
  carga: "negro",
  sistema: "imagen-4",
};

function leerSlug(cual: Cual) {
  try {
    return (
      localStorage.getItem(`${CLAVE[cual]}-slug`) ??
      FONDOS_PREDETERMINADOS[cual]
    );
  } catch {
    return "";
  }
}

/* Que pastilla se ve marcada sale de `localStorage`, que no es estado de
   React: es una fuente externa. Se lee con `useSyncExternalStore` en vez de
   con `useState` + `useEffect` por dos razones —una de correccion y una de
   regla—:

    - En el servidor no hay `localStorage`. La instantanea del servidor es la
      vacia, y React vuelve a leer al hidratar, asi que no hay discrepancia.
    - Poner estado dentro de un efecto encadena renderizados y el linter lo
      prohibe (`react-hooks/set-state-in-effect`), con razon: aqui no hace
      falta ningun render extra.

   La instantanea es UNA cadena porque tiene que ser estable entre llamadas:
   devolver un objeto nuevo cada vez haria que React renderizara en bucle. */
const oyentes = new Set<() => void>();

function suscribir(avisa: () => void) {
  oyentes.add(avisa);
  /* `storage` cubre el caso de tener login y registro en dos pestañas. */
  window.addEventListener("storage", avisa);
  return () => {
    oyentes.delete(avisa);
    window.removeEventListener("storage", avisa);
  };
}

function leerAcento() {
  try {
    return localStorage.getItem(`${CLAVE_ACENTO}-slug`) ?? "";
  } catch {
    return "";
  }
}

function leerEnvio() {
  try {
    return localStorage.getItem(CLAVE_CARGA_ENVIO) ?? "";
  } catch {
    return "";
  }
}

function leerAcentoTarjeta() {
  try {
    return localStorage.getItem(CLAVE_ACENTO_TARJETA) ?? "";
  } catch {
    return "";
  }
}

const instantanea = () =>
  `${leerSlug("login")}|${leerSlug("carga")}|${leerAcento()}|${leerEnvio()}|${leerSlug("sistema")}|${leerAcentoTarjeta()}`;
const EN_SERVIDOR = "|||||";

function avisar() {
  for (const avisa of oyentes) avisa();
}

/**
 * El interruptor de dieta del panel.
 *
 * Vive aqui y no en Nutricion por la misma razon que los fondos: es una
 * herramienta para DECIDIR mirando, no una funcion de la app. Solo se pinta
 * dentro de la app —en las pantallas de acceso no hay sesion que consultar— y
 * el estado se lee del servidor, no de `localStorage`: la dieta es un dato de
 * la cuenta, no una preferencia del navegador.
 *
 * Apagar baja `is_active` y NO borra nada, asi que el plan vuelve entero al
 * encenderlo. Borrar solo alcanza al plan de ejemplo que sembro esta misma
 * herramienta, y pide confirmacion antes.
 */
function InterruptorDieta() {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoDieta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [pendiente, empezar] = useTransition();

  useEffect(() => {
    let vivo = true;
    estadoDeLaDieta().then((resultado) => {
      if (!vivo) return;
      if ("error" in resultado) setError(resultado.error);
      else setEstado(resultado);
    });
    return () => {
      vivo = false;
    };
  }, []);

  function aplicar(
    accion: () => Promise<Awaited<ReturnType<typeof alternarDieta>>>,
  ) {
    empezar(async () => {
      const resultado = await accion();
      if ("error" in resultado) {
        setError(resultado.error);
        return;
      }
      setError(null);
      setEstado(resultado);
      setConfirmando(false);
      /* La pagina de Nutricion es de servidor: sin refrescar, el panel diria
         una cosa y la pantalla seguiria mostrando otra. */
      router.refresh();
    });
  }

  const opciones = [
    { activa: true, rotulo: "Con dieta" },
    { activa: false, rotulo: "Sin dieta" },
  ];

  return (
    <div className="mb-3">
      <p className="mb-1.5 text-white/40">Dieta del usuario</p>
      <div className="flex flex-wrap gap-1">
        {opciones.map((opcion) => {
          const marcada = estado?.activa === opcion.activa;
          return (
            <button
              key={opcion.rotulo}
              type="button"
              disabled={pendiente || !estado}
              onClick={() => aplicar(() => alternarDieta(opcion.activa))}
              aria-pressed={marcada}
              className={`rounded-lg border px-2 py-1 transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.97] disabled:opacity-40 ${
                marcada
                  ? "border-white/60 bg-white/85 text-black"
                  : "border-white/12 bg-white/5 hover:border-white/30 hover:bg-white/12"
              }`}
            >
              {opcion.rotulo}
            </button>
          );
        })}
      </div>

      {/* Se dice cual de las dos cosas hara "Con dieta", porque no es la misma
          en una cuenta con plan guardado que en una recien creada. */}
      <p className="mt-1.5 leading-relaxed text-white/35">
        {!estado
          ? "Leyendo…"
          : estado.activa
            ? "Apagar no borra el plan: vuelve entero al encender."
            : estado.hayPlan
              ? "Encender reactiva el plan que ya tienes guardado."
              : "No hay ningún plan: al encender se siembra uno de ejemplo."}
      </p>

      {estado?.hayEjemplo ? (
        <button
          type="button"
          disabled={pendiente}
          onClick={() =>
            confirmando ? aplicar(borrarPlanDeEjemplo) : setConfirmando(true)
          }
          onBlur={() => setConfirmando(false)}
          className="mt-1.5 rounded-lg border border-white/12 bg-white/5 px-2 py-1 text-white/60 transition-colors duration-150 ease-out hover:border-white/30 hover:bg-white/12 hover:text-white active:scale-[0.97] disabled:opacity-40"
        >
          {confirmando ? "¿Seguro? Pulsa otra vez" : "Borrar plan de ejemplo"}
        </button>
      ) : null}

      {error ? <p className="mt-1.5 text-[#ff8e94]">{error}</p> : null}
    </div>
  );
}

export function BackgroundSwitcher() {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  /* Las pantallas de acceso montan el mismo panel y ahi no hay sesion que
     consultar, asi que el interruptor solo aparece dentro de la app. */
  const enLaApp = !/^\/(login|registro|recuperar)/.test(pathname ?? "");
  const guardado = useSyncExternalStore(
    suscribir,
    instantanea,
    () => EN_SERVIDOR,
  );
  const [
    login = "",
    carga = "",
    acento = "",
    envio = "",
    sistema = "",
    acentoTarjeta = "",
  ] = guardado.split("|");
  const elegido: Record<Cual, string> = { login, carga, sistema };

  function repetirIntro() {
    window.dispatchEvent(new Event("pancis:repetir-intro"));
  }

  function elegir(cual: Cual, fondo: FondoCandidato) {
    /* Valor vacio es "ninguno": se RETIRA la variable en vez de escribirla
       vacia. Escribir "" dejaria la capa declarada con un valor invalido, y el
       CSS ya tiene su reserva para el caso de que no exista. */
    if (fondo.valor === "") {
      document.documentElement.style.removeProperty(VARIABLE[cual]);
    } else {
      document.documentElement.style.setProperty(VARIABLE[cual], fondo.valor);
    }
    try {
      if (fondo.valor === "") {
        localStorage.removeItem(CLAVE[cual]);
      } else {
        localStorage.setItem(CLAVE[cual], fondo.valor);
      }
      localStorage.setItem(`${CLAVE[cual]}-slug`, fondo.slug);
    } catch {
      /* Ventana privada o almacenamiento bloqueado: el cambio se ve igual,
         solo no sobrevive al recargado. */
    }
    avisar();
    /* El fondo de la carga solo se ve durante la carga. Cambiarlo sin volver
       a lanzar la introduccion no mostraria nada. */
    if (cual === "carga") repetirIntro();
  }

  function elegirAcento(candidato: AcentoCandidato) {
    let hoja = document.getElementById(ID_HOJA_ACENTO);
    if (!candidato.color) {
      hoja?.remove();
    } else {
      if (!hoja) {
        hoja = document.createElement("style");
        hoja.id = ID_HOJA_ACENTO;
        document.head.append(hoja);
      }
      hoja.textContent = hojaDelAcento(candidato.color);
    }
    try {
      if (candidato.color) {
        localStorage.setItem(CLAVE_ACENTO, hojaDelAcento(candidato.color));
      } else {
        localStorage.removeItem(CLAVE_ACENTO);
      }
      localStorage.setItem(`${CLAVE_ACENTO}-slug`, candidato.slug);
    } catch {
      /* ignorado: ver arriba */
    }
    avisar();
  }

  function elegirEnvio(carga: CargaEnvio) {
    const raiz = document.documentElement;
    /* "Actual" no es un valor: es no tener atributo. Asi la variante vive
       entera en el CSS y quitarla no deja rastro. */
    if (carga.slug === cargasDelEnvio[0]?.slug) {
      raiz.removeAttribute(ATRIBUTO_CARGA_ENVIO);
    } else {
      raiz.setAttribute(ATRIBUTO_CARGA_ENVIO, carga.slug);
    }
    try {
      localStorage.setItem(CLAVE_CARGA_ENVIO, carga.slug);
    } catch {
      /* ignorado: ver arriba */
    }
    avisar();
  }

  /* Mismo camino que `elegirEnvio`: un atributo en <html> y nada mas. El
     primer candidato es el vigente, y «vigente» aqui es no tener atributo,
     asi que la variante vive entera en el CSS y quitarla no deja rastro. */
  function elegirAcentoTarjeta(candidato: AcentoTarjeta) {
    const raiz = document.documentElement;
    if (candidato.slug === acentosDeTarjeta[0]?.slug) {
      raiz.removeAttribute(ATRIBUTO_ACENTO_TARJETA);
    } else {
      raiz.setAttribute(ATRIBUTO_ACENTO_TARJETA, candidato.slug);
    }
    try {
      localStorage.setItem(CLAVE_ACENTO_TARJETA, candidato.slug);
    } catch {
      /* ignorado: ver arriba */
    }
    avisar();
  }

  function limpiar() {
    for (const cual of ["login", "carga", "sistema"] as const) {
      document.documentElement.style.removeProperty(VARIABLE[cual]);
      try {
        localStorage.removeItem(CLAVE[cual]);
        localStorage.removeItem(`${CLAVE[cual]}-slug`);
      } catch {
        /* ignorado: ver arriba */
      }
    }
    document.getElementById(ID_HOJA_ACENTO)?.remove();
    document.documentElement.removeAttribute(ATRIBUTO_CARGA_ENVIO);
    document.documentElement.removeAttribute(ATRIBUTO_ACENTO_TARJETA);
    try {
      localStorage.removeItem(CLAVE_ACENTO_TARJETA);
      localStorage.removeItem(CLAVE_CARGA_ENVIO);
      localStorage.removeItem(CLAVE_ACENTO);
      localStorage.removeItem(`${CLAVE_ACENTO}-slug`);
    } catch {
      /* ignorado: ver arriba */
    }
    avisar();
  }

  /* El fondo del SISTEMA usa los mismos candidatos que el login —las fotos y
     el gradiente— porque la pregunta es justo esa: si la misma imagen aguanta
     en las dos pantallas o si cada una pide la suya. Delante va "Ninguno",
     que es el lienzo de siempre: sin el no habria forma de volver atras, y sin
     punto de comparacion tampoco hay decision. */
  const fondosDelSistema: FondoCandidato[] = [
    { slug: "ninguno", rotulo: "Ninguno", valor: "none" },
    ...fondosDelLogin,
  ];
  const grupos: { cual: Cual; titulo: string; lista: FondoCandidato[] }[] = [
    { cual: "login", titulo: "Fondo del login", lista: fondosDelLogin },
    { cual: "sistema", titulo: "Fondo del sistema", lista: fondosDelSistema },
    { cual: "carga", titulo: "Fondo de la carga", lista: fondosDeLaCarga },
  ];

  return (
    /* Abajo a la DERECHA: abajo a la izquierda vive el indicador de las
       herramientas de desarrollo de Next, y se tapaban. */
    <div className="pointer-events-auto fixed right-4 bottom-4 z-50 font-mono text-[11px] text-white/80">
      {abierto ? (
        /* Con el interruptor de dieta el panel pasa de largo a mas largo que
           una pantalla de portatil. Se le pone techo y se desplaza por dentro
           en vez de salirse por arriba, que es donde no hay forma de llegar. */
        <div className="max-h-[calc(100dvh-2rem)] w-[248px] overflow-y-auto overscroll-contain rounded-2xl border border-white/12 bg-black/72 p-3 shadow-[0_24px_60px_-24px_rgb(0_0_0/90%)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="tracking-[0.14em] text-white/50 uppercase">
              Fondos
            </span>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded-md px-2 py-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              Cerrar
            </button>
          </div>

          {/* Arriba del todo: es lo que cambia la pantalla entera, no solo
              su acabado. */}
          {enLaApp ? <InterruptorDieta /> : null}

          {/* Como llevan el acento Calorias y Sustituto rapido. Las tres
              opciones tocan las MISMAS dos tarjetas: lo que se compara es el
              tratamiento, no cuantas lo llevan. */}
          {enLaApp ? (
            <div className="mb-3">
              <p className="mb-1.5 text-white/40">Acento de la tarjeta</p>
              <div className="flex flex-wrap gap-1">
                {acentosDeTarjeta.map((candidato) => {
                  const activo = acentoTarjeta
                    ? acentoTarjeta === candidato.slug
                    : candidato.slug === acentosDeTarjeta[0]?.slug;
                  return (
                    <button
                      key={candidato.slug}
                      type="button"
                      onClick={() => elegirAcentoTarjeta(candidato)}
                      aria-pressed={activo}
                      className={`rounded-lg border px-2 py-1 transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.97] ${
                        activo
                          ? "border-white/60 bg-white/85 text-black"
                          : "border-white/12 bg-white/5 hover:border-white/30 hover:bg-white/12"
                      }`}
                    >
                      {candidato.rotulo}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 leading-relaxed text-white/35">
                Solo en Nutrición, y solo en Calorías y Sustituto rápido.
              </p>
            </div>
          ) : null}

          {grupos.map(({ cual, titulo, lista }) => (
            <div key={cual} className="mb-3">
              <p className="mb-1.5 text-white/40">{titulo}</p>
              <div className="flex flex-wrap gap-1">
                {lista.map((fondo) => {
                  const activo = elegido[cual] === fondo.slug;
                  return (
                    <button
                      key={fondo.slug}
                      type="button"
                      onClick={() => elegir(cual, fondo)}
                      aria-pressed={activo}
                      title={fondo.rotulo}
                      className={`rounded-lg border px-2 py-1 transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.97] ${
                        activo
                          ? "border-white/60 bg-white/85 text-black"
                          : "border-white/12 bg-white/5 hover:border-white/30 hover:bg-white/12"
                      }`}
                    >
                      {fondo.rotulo}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* El acento: las dos opciones por separado, y Actual al lado para
              tener con que compararlas sin salir del panel. La muestra
              redonda lleva la rampa entera —no el token— para que se vea CUAL
              es antes de pulsarla. */}
          <div className="mb-3">
            <p className="mb-1.5 text-white/40">Acento del producto</p>
            <div className="flex flex-wrap gap-1">
              {acentosDelProducto.map((candidato) => {
                /* Sin nada guardado el marcado es Actual, que es el unico
                   candidato sin sustitucion. */
                const activo = acento
                  ? acento === candidato.slug
                  : candidato.color === null;
                return (
                  <button
                    key={candidato.slug}
                    type="button"
                    onClick={() => elegirAcento(candidato)}
                    aria-pressed={activo}
                    title={candidato.color?.primary ?? "El de la paleta"}
                    className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.97] ${
                      activo
                        ? "border-white/60 bg-white/85 text-black"
                        : "border-white/12 bg-white/5 hover:border-white/30 hover:bg-white/12"
                    }`}
                  >
                    {candidato.color ? (
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full"
                        style={{ background: candidato.color.marca }}
                      />
                    ) : null}
                    {candidato.rotulo}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Que se ve mientras el formulario envia. Para verlo hay que
              enviar: el boton de "Repetir intro" de aqui abajo no lo lanza,
              porque no es la entrada sino la espera del envio. */}
          <div className="mb-3">
            <p className="mb-1.5 text-white/40">Carga al enviar</p>
            <div className="flex flex-wrap gap-1">
              {cargasDelEnvio.map((carga) => {
                const activo = envio
                  ? envio === carga.slug
                  : carga.slug === cargasDelEnvio[0]?.slug;
                return (
                  <button
                    key={carga.slug}
                    type="button"
                    onClick={() => elegirEnvio(carga)}
                    aria-pressed={activo}
                    className={`rounded-lg border px-2 py-1 transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.97] ${
                      activo
                        ? "border-white/60 bg-white/85 text-black"
                        : "border-white/12 bg-white/5 hover:border-white/30 hover:bg-white/12"
                    }`}
                  >
                    {carga.rotulo}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-1 border-t border-white/10 pt-2">
            <button
              type="button"
              onClick={repetirIntro}
              className="flex-1 rounded-lg border border-white/12 bg-white/5 px-2 py-1.5 transition-colors duration-150 ease-out hover:border-white/30 hover:bg-white/12 active:scale-[0.97]"
            >
              Repetir intro
            </button>
            <button
              type="button"
              onClick={limpiar}
              title="Volver a los valores del CSS"
              className="rounded-lg border border-white/12 bg-white/5 px-2 py-1.5 text-white/60 transition-colors duration-150 ease-out hover:border-white/30 hover:bg-white/12 hover:text-white active:scale-[0.97]"
            >
              Reiniciar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="rounded-full border border-white/12 bg-black/60 px-3 py-2 tracking-[0.08em] uppercase backdrop-blur-xl transition-[transform,background-color] duration-150 ease-out hover:bg-black/80 active:scale-[0.97]"
        >
          Fondos
        </button>
      )}
    </div>
  );
}
