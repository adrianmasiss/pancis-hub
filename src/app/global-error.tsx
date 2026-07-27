"use client"; // Los limites de error deben ser componentes de cliente.

import { useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ErrorState } from "@/components/shared/error-state";
import { messages } from "@/i18n/es-419";
import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

/**
 * Ultimo recurso: solo entra si falla el layout raiz.
 *
 * Sustituye al layout raiz por completo, asi que repite html, body, fuentes y
 * hoja de estilos. ThemeProvider tampoco corre aqui, de modo que la clase
 * .dark se aplica con un script minimo que lee la misma llave de
 * localStorage ("theme") que usa el proveedor: sin el, la pagina de fallo
 * apareceria siempre en claro sobre una app en oscuro.
 *
 * metadata no esta soportado en este archivo; el titulo va como <title>.
 */
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");var d=t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}`;

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <title>{`${messages.errorState.title} | ${messages.app.name}`}</title>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4 py-16">
          <ErrorState
            onRetry={() => unstable_retry()}
            detail={error.digest}
            className="w-full"
          />
        </main>
      </body>
    </html>
  );
}
