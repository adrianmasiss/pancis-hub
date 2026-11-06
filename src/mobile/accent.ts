/**
 * Acento de la vista movil, elegible en Perfil. Solo afecta al telefono:
 * escritorio sigue con su paleta.
 *
 * Historia: naranja #FF4829 (oct 2026); en nov 5, naranja, rosa, lima y
 * menta. En nov 6 el usuario entrego su paleta «neón» para el modo oscuro:
 * se SUMAN burgundy, gold, cyan y merlot (los de antes se quedan) y el lima
 * toma los valores de esa paleta (#D9F24A; el de antes, #D4FF3A, era casi el
 * mismo). En naranja, rosa y menta los campos neón se derivan con la misma
 * proporcion que la paleta usa en el lima.
 *
 * Cada acento trae, del modo oscuro de esa paleta:
 * - `fill`: relleno (boton principal, pildora activa, logo y cargadores) con
 *   `onFill` encima. Merlot es el unico con texto blanco.
 * - `text` y `chip`: el chip de «va bien» (texto y fondo).
 * - `zoneOn` y `zoneLabel`: la zona sana de las barras de rango y su rotulo.
 * - `light` y `deep`: el degradado del «+» y de la pildora de la barra.
 * `inkLight` no es de la paleta: es el acento como texto en modo claro,
 * oscurecido hasta 4.5:1 sobre blanco.
 *
 * Gold y cyan cambian ademas colores que chocarian con ellos (el ambar de
 * «va mal», la serie de grasa o la de musculo): eso vive en mobile.css bajo
 * `.m-app[data-accent]`, solo en oscuro.
 */
type AccentDef = {
  label: string;
  fill: string;
  onFill: string;
  text: string;
  chip: string;
  zoneOn: string;
  zoneLabel: string;
  light: string;
  deep: string;
  inkLight: string;
};

export const MOBILE_ACCENTS = {
  naranja: {
    label: "Naranja",
    fill: "#FF4829",
    onFill: "#111113",
    text: "#FF7058",
    chip: "rgb(255 72 41 / 0.13)",
    zoneOn: "#441C16",
    zoneLabel: "#B6766F",
    light: "#FF654B",
    deep: "#C73820",
    inkLight: "#C42A12",
  },
  rosa: {
    label: "Rosa",
    fill: "#FF5FA2",
    onFill: "#111113",
    text: "#FF82B6",
    chip: "rgb(255 95 162 / 0.13)",
    zoneOn: "#442131",
    zoneLabel: "#B67E99",
    light: "#FF79B1",
    deep: "#C74A7E",
    inkLight: "#B8246A",
  },
  lima: {
    label: "Lima",
    fill: "#D9F24A",
    onFill: "#161807",
    text: "#E3F577",
    chip: "rgb(217 242 74 / 0.13)",
    zoneOn: "#3B411E",
    zoneLabel: "#99A364",
    light: "#E1F56E",
    deep: "#A9BD3A",
    inkLight: "#4A6400",
  },
  menta: {
    label: "Menta",
    fill: "#6EF5C6",
    onFill: "#111113",
    text: "#8EF7D3",
    chip: "rgb(110 245 198 / 0.13)",
    zoneOn: "#244239",
    zoneLabel: "#83B2A6",
    light: "#85F7CF",
    deep: "#56BF9A",
    inkLight: "#0E7A55",
  },
  burgundy: {
    label: "Burgundy",
    fill: "#F5265B",
    onFill: "#190409",
    text: "#F85C84",
    chip: "rgb(245 38 91 / 0.13)",
    zoneOn: "#421421",
    zoneLabel: "#A4516B",
    light: "#F7517C",
    deep: "#BF1E47",
    inkLight: "#B5123F",
  },
  gold: {
    label: "Gold",
    fill: "#FFDD00",
    onFill: "#1A1600",
    text: "#FFE640",
    chip: "rgb(255 221 0 / 0.13)",
    zoneOn: "#443C0D",
    zoneLabel: "#A89A46",
    light: "#FFE433",
    deep: "#C7AC00",
    inkLight: "#7A6500",
  },
  cyan: {
    label: "Cyan",
    fill: "#3DF2E0",
    onFill: "#061816",
    text: "#6EF5E8",
    chip: "rgb(61 242 224 / 0.13)",
    zoneOn: "#19413F",
    zoneLabel: "#5AA3A0",
    light: "#64F5E6",
    deep: "#30BDAF",
    inkLight: "#0B7268",
  },
  merlot: {
    label: "Merlot",
    fill: "#B8305F",
    onFill: "#FFFFFF",
    text: "#CA6487",
    chip: "rgb(184 48 95 / 0.2)",
    zoneOn: "#4C1B2D",
    zoneLabel: "#8C556C",
    light: "#C6597F",
    deep: "#90254A",
    inkLight: "#9C2650",
  },
} as const satisfies Record<string, AccentDef>;

export type MobileAccent = keyof typeof MOBILE_ACCENTS;

export const MOBILE_ACCENT_COOKIE = "pc-m-accent";
export const DEFAULT_MOBILE_ACCENT: MobileAccent = "naranja";

export function isMobileAccent(value: unknown): value is MobileAccent {
  return typeof value === "string" && value in MOBILE_ACCENTS;
}

/** El acento guardado en la cookie, o el de siempre. */
export function resolveMobileAccent(value: unknown): MobileAccent {
  return isMobileAccent(value) ? value : DEFAULT_MOBILE_ACCENT;
}

/** Variables CSS del acento, para el `style` de `.m-app`. */
export function accentVars(accent: MobileAccent): Record<string, string> {
  const a: AccentDef = MOBILE_ACCENTS[accent];
  return {
    "--m-accent": a.fill,
    "--m-accent-ink-light": a.inkLight,
    "--m-on-accent": a.onFill,
    "--m-accent-line-dark": a.fill,
    /* En claro, el relleno ya se ve como linea (si es muy claro, los textos
       usan `inkLight`). */
    "--m-accent-line-light": a.fill,
    "--m-accent-text-dark": a.text,
    "--m-accent-chip-dark": a.chip,
    "--m-zone-on-dark": a.zoneOn,
    "--m-zone-label-dark": a.zoneLabel,
    "--m-accent-light": a.light,
    "--m-accent-deep": a.deep,
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
  const on = a.onFill;
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
