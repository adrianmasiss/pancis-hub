import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import {
  DEFAULT_MODE,
  DEFAULT_PALETTE,
  PALETTE_STORAGE_KEY,
  THEME_MODE_COOKIE,
  THEME_PREFERENCE_COOKIE,
} from "@/lib/theme/apply";
import {
  PALETTES,
  PALETTE_TOKENS,
  TOKEN_CSS_VAR,
  isPaletteName,
} from "@/lib/theme/palettes";
import { PwaRuntime } from "@/components/shared/pwa-runtime";
import { CON_SELECTOR, GUION_FONDOS } from "@/features/auth/fondos-guion";
import { Toaster } from "@/components/ui/sonner";
import { messages } from "@/i18n/es-419";
import "./globals.css";
// Prueba de tipografía: quitar esta línea para volver a Karrik + Mono.
import "./tipografia.css";
// El ultimo: el acomodo de telefono gana a las hojas de cada pantalla.
import "./movil.css";

export const viewport: Viewport = {
  // Sin esto `env(safe-area-inset-*)` vale 0 en iPhone y la vista movil no
  // puede apartarse de la isla dinamica. Solo afecta a iOS: en escritorio no
  // hay areas seguras.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090909" },
    { media: "(prefers-color-scheme: light)", color: "#FFF3E6" },
  ],
};

/**
 * Display del sistema (handoff): Karrik, de trazo irregular, solo de 26px
 * arriba. Por debajo de ese cuerpo el ruido del trazo se come la legibilidad,
 * asi que manda la sans.
 *
 * Se sirve local desde `src/app/fonts/`: el handoff la incluye en su paquete y
 * DESIGN.md prohibe fuentes remotas que aten el build a la red.
 */
const karrik = localFont({
  variable: "--font-karrik",
  display: "swap",
  src: [
    { path: "./fonts/Karrik-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Karrik-Italic.woff2", weight: "400", style: "italic" },
  ],
});

/**
 * Contrato del sistema visual, emitido en el marcado para que se pueda
 * contrastar lo construido con lo decidido sin abrir el repositorio.
 */
const DIRECTION_CONTRACT = `<!--
THESIS: Pancis Hub, una herramienta cotidiana para nutricion y entrenamiento.
OWN-WORLD: reproduccion del prototipo suministrado Pancis Hub v11.dc.html;
Pancis principal: negro y carbon con naranja/turquesa; claro beige y morado.
Gilded conservado como respaldo.
STORY: Hoy resume; Nutricion ordena el dia; Copilot explica y propone.
FIRST VIEWPORT: riel flotante, columna de 1160px y composicion 2:1 en Hoy.
FORM: direccion fijada por el usuario, sin sorteo; superficies de 24px,
lienzo de 30px, datos tabulares, controles con respuesta y movimiento reducido.
-->`;

export const metadata: Metadata = {
  title: {
    default: messages.app.name,
    template: `%s | ${messages.app.name}`,
  },
  description: messages.app.description,
  appleWebApp: {
    capable: true,
    title: messages.app.name,
    /* La app instalada dibuja bajo la barra de estado: el fondo llega hasta
       arriba sin la franja que iOS pinta con "default". Cada pantalla se
       aparta con `env(safe-area-inset-top)`. */
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png?v=2",
  },
};

/**
 * El tema se resuelve en el SERVIDOR, desde cookies.
 *
 * Antes se aplicaba despues de hidratar: medido, ~175 ms con la clase `dark`
 * puesta antes de saltar a claro, o sea un destello oscuro en cada carga para
 * quien usa modo claro. Y el mismo desfase dejaba `aria-pressed` del
 * conmutador distinto en servidor y cliente.
 *
 * Con la cookie el HTML sale ya con el modo correcto —clase, `color-scheme` y
 * `data-pc-mode`— y el proveedor arranca con el mismo valor, asi que no hay
 * nada que corregir despues.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();

  const preferencia = jar.get(THEME_PREFERENCE_COOKIE)?.value;
  const preferenciaValida =
    preferencia === "light" ||
    preferencia === "dark" ||
    preferencia === "system"
      ? preferencia
      : undefined;

  const modoCookie = jar.get(THEME_MODE_COOKIE)?.value;
  const modo =
    modoCookie === "light" || modoCookie === "dark" ? modoCookie : DEFAULT_MODE;

  const paletaCookie = jar.get(PALETTE_STORAGE_KEY)?.value;
  const paleta = isPaletteName(paletaCookie) ? paletaCookie : DEFAULT_PALETTE;

  return (
    <html
      lang="es"
      suppressHydrationWarning
      data-pc={paleta}
      data-pc-mode={modo}
      style={
        {
          colorScheme: modo,
          ...Object.fromEntries(
            PALETTE_TOKENS.map((token) => [
              TOKEN_CSS_VAR[token],
              PALETTES[paleta][modo][token],
            ]),
          ),
        } as CSSProperties
      }
      className={`${GeistSans.variable} ${GeistMono.variable} ${karrik.variable} ${modo === "dark" ? "dark" : ""} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Lo elegido en el selector de fondos, aplicado ANTES de pintar.
            Vive aqui, en la raiz, y no en cada layout: el documento es uno, y
            con una copia por seccion la hoja del acento se habria inyectado
            dos veces al navegar entre acceso y app. Ademas, un `<script>`
            dentro de un componente que React vuelve a renderizar en cliente
            no se ejecuta —lo avisa por consola—; aqui solo se renderiza en el
            servidor. Solo en desarrollo. */}
        {CON_SELECTOR ? (
          <script dangerouslySetInnerHTML={{ __html: GUION_FONDOS }} />
        ) : null}
        {/*
          El contrato de direccion va como comentario HTML DE VERDAD: React
          descarta los comentarios JSX al compilar, asi que un `{/* ... *\/}`
          aqui no llegaria nunca al marcado y nadie podria auditarlo contra lo
          construido.
        */}
        <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          initialTheme={preferenciaValida}
          initialMode={modo}
          initialPalette={paleta}
        >
          {children}
          <Toaster />
          <PwaRuntime />
        </ThemeProvider>
      </body>
    </html>
  );
}
