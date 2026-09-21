import { messages } from "@/i18n/es-419";

/**
 * Lienzo de Acceso. La tarjeta NO vive aqui: su ancho depende de si la pagina
 * es de dos columnas (entrar/crear cuenta, 1000px) o de una sola (recuperar,
 * nueva contrasena, 460px). Cuando la tarjeta estaba en el layout, las
 * pantallas de una columna heredaban el ancho de dos y quedaban con un campo
 * de 1280px de largo.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="auth-shell bg-background flex min-h-dvh flex-col items-center justify-center gap-7 px-4 py-8 sm:py-12">
      {children}
      <p className="text-subtle-foreground max-w-[52ch] text-center text-xs leading-relaxed text-pretty">
        {messages.legal.disclaimer}
      </p>
    </div>
  );
}
