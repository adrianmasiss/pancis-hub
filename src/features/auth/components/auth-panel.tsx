import { AuthFormHeader } from "@/features/auth/components/auth-form-header";

type AuthPanelProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

/**
 * Tarjeta de una sola columna: recuperar contrasena y definir una nueva.
 *
 * Comparte lienzo, tarjeta, marca y tipografia con entrar/crear cuenta, pero
 * no su panel de acento: estas pantallas no ofrecen una segunda intencion a la
 * que saltar, solo terminan una tarea y vuelven. Por eso tampoco se les da
 * ancho de dos columnas.
 */
export function AuthPanel({ title, description, children }: AuthPanelProps) {
  return (
    <main className="auth-card animate-fade-up w-full max-w-[460px]">
      <div className="flex flex-col gap-6 px-6 py-9 sm:px-9 sm:py-10">
        <AuthFormHeader title={title} description={description} />
        {children}
      </div>
    </main>
  );
}
