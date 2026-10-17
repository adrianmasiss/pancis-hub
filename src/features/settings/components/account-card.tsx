import { LogOut } from "lucide-react";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { messages } from "@/i18n/es-419";
import { PasskeySettings } from "@/features/settings/components/passkey-settings";

/**
 * Cierre de sesion en Configuracion.
 *
 * No duplica al menu del riel por descuido: el riel solo existe desde 1024px,
 * asi que sin esta tarjeta el telefono —la escena principal del producto— no
 * tendria ninguna forma de cerrar sesion.
 *
 * Es un `form` con server action y no un `onClick`: funciona sin JavaScript y
 * evita marcar toda la pagina de ajustes como cliente.
 */
export function AccountCard({ email }: { email?: string }) {
  return (
    <Section
      title={messages.settings.accountSection}
      description={messages.settings.accountDescription}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        {email ? (
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">
              {messages.settings.accountEmailLabel}
            </p>
            <p className="truncate text-sm font-medium">{email}</p>
          </div>
        ) : (
          <span />
        )}

        <form action={signOut}>
          <Button type="submit" variant="outline">
            <LogOut aria-hidden="true" />
            {messages.common.signOut}
          </Button>
        </form>
      </div>
      <PasskeySettings />
    </Section>
  );
}
