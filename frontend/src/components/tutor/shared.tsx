import { Mic, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ count, className }: { count: number; className?: string }) {
  return (
    <span className={cn("inline-flex", className)} aria-label={`${count} de 3 estrellas`}>
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} size={12} fill="currentColor" className="text-amber-500" />
      ))}
    </span>
  );
}

export function MicButton({
  listening,
  onClick,
  disabled,
}: {
  listening: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "Dejar de escuchar" : "Hablar en vez de escribir"}
      title={listening ? "Dejar de escuchar" : "Hablar en vez de escribir"}
      className={cn(
        "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 transition disabled:opacity-50",
        listening
          ? "border-rose-500 bg-rose-500 text-white"
          : "border-[rgb(var(--border))] text-muted hover:border-brand-400 hover:text-brand-600",
      )}
    >
      {listening && <span className="absolute inset-0 animate-ping rounded-2xl bg-rose-500/40" />}
      <Mic size={22} strokeWidth={2.4} className="relative" />
    </button>
  );
}
