import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRuntime } from "@/components/shared/pwa-runtime";
import { Toaster } from "@/components/ui/sonner";
import { messages } from "@/i18n/es-419";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    // --background de cada tema.
    { media: "(prefers-color-scheme: light)", color: "#ecedee" },
    { media: "(prefers-color-scheme: dark)", color: "#082032" },
  ],
};

/**
 * Inter para todo el sistema.
 *
 * Se eligio por cercania a SF Pro: mismos principios de diseno, y en iPhone la
 * cascada `system-ui` de mas abajo entrega SF de verdad. Manrope, que estaba
 * antes, es una grotesca geometrica de contadores redondos — se leia como
 * Android, que es justo lo que este rediseno vino a corregir.
 */
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Contrato del sistema visual, emitido en el marcado para que se pueda
 * contrastar lo construido con lo decidido sin abrir el repositorio.
 */
const DIRECTION_CONTRACT = `<!--
SISTEMA: Marino profundo (#082032) con el naranja del logotipo (#F05A27,
muestreado del PNG). El naranja no decora: marca lo accionable.
ACCION: una prominente por pantalla con el degradado de marca; las demas
acciones reales en naranja solido; solo los descartes se quedan callados.
REGISTRO: iOS. Esquina continua, capsula en botones y campos, iconos con
variante rellena en el activo, muelles en vez de curvas de duracion fija.
TIPO: Inter con tracking por tamano — apretado en display, abierto en cuerpos
pequenos. Nunca un solo valor para todos.
TEMAS: los dos son de primera clase. El claro invierte los neutros; el acento
y la tinta oscura sobre el no se invierten.
MAQUETA: figma.com/design/zrDvYIcBmJPjlc20hyuXxA
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
      className={`${inter.variable} h-full antialiased`}
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
