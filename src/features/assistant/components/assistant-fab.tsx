"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/shared/brand-logo";
import { CopilotDrawer } from "./copilot-drawer";
export function AssistantFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname.startsWith("/asistente")) return null;
  return (
    <>
      <button
        type="button"
        className="assistant-fab"
        aria-label="Abrir copiloto"
        onClick={() => setOpen(true)}
      >
        <BrandLogo variant="mark" height={34} />
      </button>
      <CopilotDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
