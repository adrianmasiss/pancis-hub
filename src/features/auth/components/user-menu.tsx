"use client";

import { ChevronDown, ChevronsUpDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutDevice } from "@/features/auth/sign-out-device";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
  /**
   * `icon` es el avatar suelto de una barra de acciones. `row` es la fila
   * ancha del pie del riel: avatar, nombre y correo, porque ahi si hay ancho
   * para decir de quien es la sesion sin tener que abrir el menu. `pill` es la
   * pieza de la barra superior: retrato, nombre y un disco de acento con el
   * galon, en la forma de la referencia que mando el usuario.
   */
  variant?: "icon" | "row" | "pill";
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({
  displayName,
  email,
  avatarUrl,
  variant = "icon",
}: UserMenuProps) {
  const initials = initialsOf(displayName);

  const tamano =
    variant === "row"
      ? "size-9 shrink-0"
      : variant === "pill"
        ? "size-9"
        : "size-7";
  const avatar = (
    <Avatar className={tamano}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
      <AvatarFallback
        className={variant === "icon" ? "text-xs" : "text-[11px]"}
      >
        {initials || "?"}
      </AvatarFallback>
    </Avatar>
  );

  /* La pastilla: tres piezas en una sola fila y un solo boton.
     - El retrato va primero y MUERDE la pastilla del nombre (`sm:-mr-4` y un
       `z-10`), que es lo que da la sensacion de capa de la referencia; el
       anillo del color del fondo separa las dos formas sin dibujar un borde.
       El mordisco solo existe cuando hay nombre que morder: sin el —en
       telefono— el retrato se comeria el disco.
     - El disco SI se monta sobre la pastilla, por el otro extremo, y lleva el
       mismo anillo del color del fondo que el retrato. Ese anillo es el
       "borde": es lo que hace que se lea como una pieza encima y no como una
       muesca recortada en la pastilla. La pieza queda simetrica —dos circulos
       mordiendo una barra, uno por lado—. Y el mordisco es de `sm` para
       arriba, igual que el del retrato: sin pastilla en medio, los dos
       circulos se solapaban entre si y el disco tapaba las iniciales
       —comprobado en captura a 390px—.
     - El nombre se esconde por debajo de `sm`: en un telefono la barra ya
       lleva marca y Copilot, y ahi el nombre solo quita sitio. El boton sigue
       teniendo nombre accesible, asi que no se pierde nada al ocultarlo.
     - El disco es el acento, y es la unica pieza de color: es la que dice
       "esto se abre". */
  const pastilla = (
    <span className="flex items-center">
      <span className="ring-background z-10 rounded-full ring-[3px] sm:-mr-3.5">
        {avatar}
      </span>
      <span className="bg-card-raised text-foreground hidden truncate rounded-full py-1.5 pr-6 pl-6 text-[13px] font-medium sm:block">
        {displayName}
      </span>
      <span className="bg-primary text-primary-foreground ring-background z-10 ml-1.5 grid size-9 place-items-center rounded-full ring-[3px] transition-transform group-hover:scale-[1.04] group-active:scale-95 sm:-ml-3">
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </span>
    </span>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "row" ? (
          <button
            type="button"
            aria-label={messages.common.openMenu}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors",
              "focus-visible:ring-ring hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] focus-visible:ring-2 focus-visible:outline-none",
            )}
          >
            {avatar}
            <span className="app-rail-label min-w-0 flex-1">
              <span className="text-foreground block truncate text-[13px] font-medium">
                {displayName}
              </span>
              {email ? (
                <span className="text-subtle-foreground block truncate text-[11px]">
                  {email}
                </span>
              ) : null}
            </span>
            <span className="app-rail-label shrink-0">
              <ChevronsUpDown
                className="text-subtle-foreground size-3.5"
                aria-hidden="true"
              />
            </span>
          </button>
        ) : variant === "pill" ? (
          <button
            type="button"
            aria-label={messages.common.openMenu}
            className="group focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] focus-visible:outline-none"
          >
            {pastilla}
          </button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label={messages.common.openMenu}
          >
            {avatar}
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={variant === "row" ? "start" : "end"}
        side={variant === "row" ? "top" : "bottom"}
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[220px]"
      >
        <DropdownMenuLabel className="space-y-0.5">
          <p className="text-sm font-medium">{displayName}</p>
          {email ? (
            <p className="text-muted-foreground truncate text-xs font-normal">
              {email}
            </p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOutDevice()}>
          <LogOut className="size-4" aria-hidden="true" />
          {messages.common.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
