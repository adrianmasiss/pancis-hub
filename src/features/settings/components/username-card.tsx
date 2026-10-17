"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import { FormField } from "@/components/shared/form-field";
import { updateUsername } from "@/features/settings/actions";
import {
  usernameSettingsSchema,
  type UsernameSettingsInput,
} from "@/features/settings/schemas";
import { messages } from "@/i18n/es-419";

/**
 * Cambiar el nombre de usuario.
 *
 * El actual se muestra arriba y ademas es el valor inicial del campo: cambiar
 * algo empieza por ver lo que hay. El boton se apaga mientras no haya cambio,
 * asi que "guardar" siempre significa que algo va a pasar.
 */
export function UsernameCard({ username }: { username: string | null }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<UsernameSettingsInput>({
    resolver: zodResolver(usernameSettingsSchema),
    defaultValues: { username: username ?? "" },
  });
  /* `isDirty` y no `watch()`: `watch` devuelve una funcion que el compilador
     de React no puede memoizar, y por eso desactiva la optimizacion de todo
     el componente —lo avisa el linter—. `isDirty` compara contra los valores
     iniciales, que es justo lo que hace falta aqui. */
  const sinCambio = !form.formState.isDirty;

  const onSubmit = (data: UsernameSettingsInput) => {
    startTransition(async () => {
      const result = await updateUsername(data);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(messages.settings.usernameSaved);
      /* El formulario se queda con lo que se guardo como nuevo punto de
         partida; si no, el boton seguiria activo despues de guardar. */
      form.reset({ username: data.username });
    });
  };

  return (
    <Section
      title={messages.settings.usernameSection}
      description={messages.settings.usernameDescription}
    >
      {username ? (
        <div className="mb-5 min-w-0">
          <p className="text-muted-foreground text-xs">
            {messages.settings.usernameCurrent}
          </p>
          <p className="truncate text-sm font-medium">{username}</p>
        </div>
      ) : null}

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-md space-y-4"
        noValidate
      >
        <FormField
          label={messages.settings.usernameLabel}
          autoComplete="username"
          spellCheck={false}
          autoCapitalize="none"
          help={messages.auth.fields.usernameHint}
          error={form.formState.errors.username?.message}
          {...form.register("username")}
        />
        <Button type="submit" disabled={pending || sinCambio}>
          {pending ? messages.common.loading : messages.settings.usernameSave}
        </Button>
      </form>
    </Section>
  );
}
