"use client";

import { useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { searchExercises } from "@/features/training/actions";
import type { CatalogExercise } from "@/features/training/lib/alternatives";
import { messages } from "@/i18n/es-419";

const t = messages.training;

type ExercisePickerProps = {
  onSelect: (exercise: CatalogExercise) => void | Promise<void>;
  triggerLabel?: string;
};

export function ExercisePicker({
  onSelect,
  triggerLabel,
}: ExercisePickerProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<CatalogExercise[] | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTermChange = (value: string) => {
    setTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const response = await searchExercises({ term: value });
      setSearching(false);
      if ("results" in response) setResults(response.results);
    }, 300);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setTerm("");
          setResults(null);
        }
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" aria-hidden="true" />
          {triggerLabel ?? t.addExercise}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t.addExercise}</SheetTitle>
          <SheetDescription className="sr-only">
            {t.searchExercise}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 overflow-y-auto px-4 pb-6">
          <div className="relative">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              autoFocus
              value={term}
              onChange={(event) => onTermChange(event.target.value)}
              placeholder={t.searchExercise}
              className="pl-9"
              aria-label={t.searchExercise}
            />
          </div>
          {searching ? (
            <p className="text-muted-foreground text-sm">
              {messages.common.loading}
            </p>
          ) : (
            <ul className="divide-y">
              {(results ?? []).map((exercise) => (
                <li key={exercise.id}>
                  <button
                    type="button"
                    onClick={async () => {
                      await onSelect(exercise);
                      setOpen(false);
                      setTerm("");
                      setResults(null);
                    }}
                    className="hover:bg-accent/60 flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2.5 text-left text-sm"
                  >
                    <span className="font-medium">{exercise.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {exercise.primaryMuscle}
                      {exercise.equipment ? ` · ${exercise.equipment}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
