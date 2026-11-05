/**
 * Acento de la vista movil, elegible en Perfil. Solo afecta al telefono:
 * escritorio sigue con su paleta.
 *
 * El naranja era el de la paleta Pancis (#F0793F); en oct 27 el usuario lo
 * cambio a #FF4829, mas encendido. En nov 5 dejo cuatro para elegir: el
 * naranja, el lima (el que mas le gustaba, pero recuerda a Nike) y dos que
 * hacen lo mismo que el lima —claros y encendidos sobre negro— sin
 * parecerse: rosa y menta. El cian y el lila se descartaron porque chocan
 * con las grasas y los carbohidratos.
 *
 * `fill` es el color de relleno (boton principal, pildora activa, logo y
 * cargadores) y lleva `onFill` encima (#111113). `inkLight` es el acento
 * usado COMO texto en claro: el relleno no llega a 4.5:1 sobre blanco, asi
 * que se oscurece.
 */
type AccentDef = {
  label: string;
  fill: string;
  inkLight: string;
  onFill?: string;
};

export const MOBILE_ACCENTS = {
  naranja: { label: "Naranja", fill: "#FF4829", inkLight: "#C42A12" },
  rosa: { label: "Rosa", fill: "#FF5FA2", inkLight: "#B8246A" },
  lima: { label: "Lima", fill: "#D4FF3A", inkLight: "#4A6400" },
  menta: { label: "Menta", fill: "#6EF5C6", inkLight: "#0E7A55" },
} as const satisfies Record<string, AccentDef>;

export type MobileAccent = keyof typeof MOBILE_ACCENTS;

export const MOBILE_ACCENT_COOKIE = "pc-m-accent";
export const DEFAULT_MOBILE_ACCENT: MobileAccent = "naranja";

export function isMobileAccent(value: unknown): value is MobileAccent {
  return typeof value === "string" && value in MOBILE_ACCENTS;
}

/** Variables CSS del acento, para el `style` de `.m-app`. */
export function accentVars(accent: MobileAccent): Record<string, string> {
  const a: AccentDef = MOBILE_ACCENTS[accent];
  return {
    "--m-accent": a.fill,
    "--m-accent-ink-light": a.inkLight,
    "--m-on-accent": a.onFill ?? "#111113",
    "--m-accent-line-dark": a.fill,
    /* En claro, el relleno ya se ve como linea (si es muy claro, los textos
       usan `inkLight`). */
    "--m-accent-line-light": a.fill,
  };
}

/**
 * El acento para lo que vive FUERA de `.m-app` en el telefono: el acceso, su
 * pantalla de carga, el cargador de la app, el onboarding y el logo. Todos
 * pintan con `--pc-primary`, que la paleta de escritorio fija en el `style`
 * de `<html>` y que `apply.ts` reescribe al cambiar de modo; por eso va con
 * `!important`, que gana al estilo en linea. La hoja del acceso fija su
 * propio naranja (`.login-sheet` en globals.css) y se pisa aparte.
 *
 * El logotipo son dos capas de la misma mascara: el acento debajo, en toda
 * la palabra, y la tinta encima, solo en «Pancis». En los bordes suavizados
 * la capa de abajo se asomaba: con el naranja no se notaba, pero el lima
 * dejaba un halo verde alrededor de «Pancis». Por eso el acento se recorta a
 * «Hub» (lo que la tinta no cubre). Ademas, en el acceso y en la carga el
 * fondo siempre es oscuro (foto o #070707), pero la tinta seguia el modo y en
 * claro salia casi negra; ahi va blanca, y el lema en el gris del oscuro.
 */
export function phoneAccentCss(accent: MobileAccent): string {
  const a: AccentDef = MOBILE_ACCENTS[accent];
  const on = a.onFill ?? "#111113";
  const vars = (pairs: [string, string][]) =>
    pairs.map(([k, v]) => `${k}:${v}!important`).join(";");
  return (
    `html{${vars([
      ["--pc-primary", a.fill],
      ["--pc-primary-strong", a.fill],
      ["--pc-primary-fg", on],
      ["--pc-brand-from", a.fill],
      ["--pc-brand-to", a.fill],
    ])}}` +
    `html[data-pc] .login-stage .login-sheet{${vars([
      ["--primary", a.fill],
      ["--primary-strong", a.fill],
      ["--primary-foreground", on],
      ["--ring", a.fill],
    ])}}` +
    `.brand-artwork-name::before{clip-path:inset(0 0 0 60%)}` +
    `.brand-artwork-wordmark::before{clip-path:polygon(0 0,25% 0,25% 82%,70.5% 82%,70.5% 0,100% 0,100% 82%,22% 82%,22% 100%,0 100%)}` +
    `:is(.auth-shell,.app-loading) .brand-artwork{--logo-ink:#fff}` +
    `html[data-pc] :is(.login-brand-name p,.login-intro-progress small,.auth-shell:has(.login-stage)>p){color:#b0b0b0}`
  );
}
