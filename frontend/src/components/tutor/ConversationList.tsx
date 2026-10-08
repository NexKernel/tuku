import { Medal, Sparkles } from "lucide-react";
import { isCompleted, progressOf, stepsFor } from "@/lib/thinking";
import type { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ConversationList({
  conversations,
  activeId,
  onOpen,
  limit,
}: {
  conversations: Conversation[] | undefined;
  activeId?: string;
  onOpen: (id: string) => void;
  limit?: number;
}) {
  const items = limit ? conversations?.slice(0, limit) : conversations;
  if (!items?.length) {
    return (
      <p className="rounded-2xl bg-brand-500/5 px-3 py-3 text-sm text-muted">
        Aún no tienes retos. ¡Empieza el primero!
      </p>
    );
  }
  return (
    <div className="min-h-0 space-y-1.5 overflow-y-auto">
      {items.map((c) => {
        const { index, total } = progressOf(c);
        const done = isCompleted(c.current_step);
        const StepIcon = stepsFor(c.path)[index]?.icon ?? Sparkles;
        return (
          <button
            key={c.id}
            onClick={() => onOpen(c.id)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition",
              activeId === c.id ? "bg-brand-500/15" : "hover:bg-brand-500/10",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                done ? "bg-emerald-500 text-white" : "bg-brand-500/15 text-brand-600 dark:text-brand-300",
              )}
            >
              {done ? <Medal size={16} /> : <StepIcon size={16} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{c.title}</span>
              <span className="block text-xs text-muted">
                {done ? "¡Completado!" : `Paso ${index + 1} de ${total}`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
