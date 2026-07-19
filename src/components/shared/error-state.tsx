import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = messages.errorState.title,
  description = messages.errorState.description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border px-6 py-16 text-center",
        className,
      )}
    >
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground max-w-md text-sm text-balance">
        {description}
      </p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          {messages.common.retry}
        </Button>
      ) : null}
    </div>
  );
}
