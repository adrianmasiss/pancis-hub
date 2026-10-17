"use client";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetDescription,
} from "@/components/ui/sheet";
import { BrandLogo } from "@/components/shared/brand-logo";
import { AssistantChat } from "./assistant-chat";
export function CopilotDrawer({
  open,
  onOpenChange,
  contextTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextTitle?: string;
}) {
  const pathname = usePathname();
  const context = pathname.startsWith("/nutricion")
    ? "Nutrición"
    : pathname.startsWith("/entrenamiento")
      ? "Entrenamiento"
      : pathname.startsWith("/progreso")
        ? "Progreso"
        : "Tu día";
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="copilot-drawer"
      >
        <SheetHeader className="copilot-drawer-header">
          <div className="flex items-center gap-3">
            <BrandLogo variant="mark" height={30} />
            <div>
              <SheetTitle>Copilot</SheetTitle>
              <SheetDescription>
                {contextTitle ?? `Contexto: ${context}`}
              </SheetDescription>
            </div>
          </div>
          <SheetClose
            className="copilot-drawer-close"
            aria-label="Cerrar copiloto"
          >
            <X className="size-4" />
          </SheetClose>
        </SheetHeader>
        <AssistantChat compact />
      </SheetContent>
    </Sheet>
  );
}
