import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRuntime } from "@/components/shared/pwa-runtime";
import { Toaster } from "@/components/ui/sonner";
import { messages } from "@/i18n/es-419";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0d1210",
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
SISTEMA: instrumento editorial de salud. Carbon calido, marfil y un unico
acento terracota para decisiones, estado y progreso.
ACCION: jerarquia por escala, ritmo y filetes. Las superficies solo aparecen
cuando explican una elevacion real.
FORMA: composicion asimetrica, radios contenidos, datos tabulares y fotografia
gastronomica tratada como contexto, no como decoracion.
TIPO: Geist Sans; titulares sobrios, cifras calibradas y lectura compacta.
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
      className={`${GeistSans.variable} ${GeistMono.variable} ${karrik.variable} dark h-full antialiased`}
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
          defaultTheme="dark"
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
