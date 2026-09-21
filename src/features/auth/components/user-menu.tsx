"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
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
import { signOut } from "@/features/auth/actions";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
  /**
   * `icon` es el avatar suelto de una barra de acciones. `row` es la fila
   * ancha del pie del riel: avatar, nombre y correo, porque ahi si hay ancho
   * para decir de quien es la sesion sin tener que abrir el menu.
   */
  variant?: "icon" | "row";
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

  const avatar = (
    <Avatar className={variant === "row" ? "size-9 shrink-0" : "size-7"}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
      <AvatarFallback className={variant === "row" ? "text-[11px]" : "text-xs"}>
        {initials || "?"}
      </AvatarFallback>
    </Avatar>
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
              "hover:bg-white/[0.045] focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:outline-none",
            )}
          >
            {avatar}
            <span className="app-rail-label min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-white/90">
                {displayName}
              </span>
              {email ? (
                <span className="block truncate text-[11px] text-white/38">
                  {email}
                </span>
              ) : null}
            </span>
            <span className="app-rail-label shrink-0">
              <ChevronsUpDown
                className="size-3.5 text-white/38"
                aria-hidden="true"
              />
            </span>
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
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut className="size-4" aria-hidden="true" />
          {messages.common.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
