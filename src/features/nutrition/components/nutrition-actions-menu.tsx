"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  Apple,
  ArrowLeftRight,
  Brain,
  CopyPlus,
  EllipsisVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { duplicateDay } from "@/features/nutrition/actions";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition;

function shiftDate(date: string, days: number): string {
  const ms = new Date(`${date}T00:00:00Z`).getTime() + days * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Agrupa las acciones secundarias de Nutricion (todo salvo agregar comida). */
export function NutritionActionsMenu({ date }: { date: string }) {
  const [pending, startTransition] = useTransition();

  const onDuplicate = () => {
    startTransition(async () => {
      const result = await duplicateDay({
        fromDate: shiftDate(date, -1),
        toDate: date,
      });
      if ("error" in result) toast.error(result.error);
      else toast.success(t.dayDuplicated);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={messages.common.moreOptions}
        >
          <EllipsisVertical className="size-4" aria-hidden="true" />
          {messages.common.moreOptions}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem asChild>
          <Link href="/nutricion/alimentos">
            <Apple className="size-4" aria-hidden="true" />
            {messages.foods.title}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/nutricion/dieta">
            <Brain className="size-4" aria-hidden="true" />
            {messages.nutrition.aiDiet.pageTitle}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/nutricion/comparar">
            <ArrowLeftRight className="size-4" aria-hidden="true" />
            {messages.nutrition.compare.title}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={pending} onSelect={onDuplicate}>
          <CopyPlus className="size-4" aria-hidden="true" />
          {t.duplicateYesterday}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
