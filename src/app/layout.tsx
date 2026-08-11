import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Black } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRuntime } from "@/components/shared/pwa-runtime";
import { Toaster } from "@/components/ui/sonner";
import { messages } from "@/i18n/es-419";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    // Equivalentes sRGB de --background en cada tema (handoff v2).
    { media: "(prefers-color-scheme: light)", color: "#faf7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#211f1e" },
  ],
};

/**
 * Archivo para todo el sistema: una grotesca de senaletica, con la caja alta
 * y las cifras que un rotulo industrial necesita. Una sola familia, como pide
 * una interfaz de trabajo.
 */
const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

/**
 * La voz de la cifra, y solo de la cifra. Los numerales troquelados de un
 * disco se leen al otro lado del gimnasio porque son gruesos y anchos, no
 * porque sean decorativos. Nunca se usa en etiquetas ni en botones.
 */
const archivoBlack = Archivo_Black({
  variable: "--font-stamp",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/**
 * Contrato de la direccion visual. Se emite en el marcado para que cualquiera
 * pueda contrastar lo construido con lo decidido, sin abrir el repositorio.
 */
const DIRECTION_CONTRACT = `<!--
THESIS: El color no decora, es la magnitud. Cada macro lleva para siempre su
disco del codigo olimpico y nada mas en la pantalla lleva color. Se rechaza la
rejilla de tarjetas: el contenido vive sobre el suelo y lo separan reglas cuyo
grosor es la jerarquia.
OWN-WORLD: Tiza y acero en claro, goma de bumper en oscuro. Discos 25 rojo /
20 azul / 15 amarillo / 10 verde / 5 blanco como codigo semantico. Archivo para
todo; Archivo Black solo en la cifra. Radio 2px: el acero no es blando. Reglas
de 1, 2 y 3 px, y el grosor es la jerarquia.
STORY: De pie, con una mano, ves lo que te falta hoy antes de leer nada, y
marcas lo hecho en un gesto que encaja como un collarin.
FIRST VIEWPORT: fecha y estado en una linea; "faltan" a escala de numeral
troquelado; una fila por macro con su disco a la izquierda, el ancho del color
como magnitud y la muesca del plan; la navegacion a la altura del pulgar.
FORM: Codigo de disco, candidata 7 de la lista ordenada por resonancia;
seed b92093d8.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
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
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${archivo.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/*
          El contrato de direccion va como comentario HTML DE VERDAD: React
          descarta los comentarios JSX al compilar, asi que un `{/* ... *\/}`
          aqui no llegaria nunca al marcado y nadie podria auditarlo contra lo
          construido.
        */}
        <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <PwaRuntime />
        </ThemeProvider>
      </body>
    </html>
  );
}
