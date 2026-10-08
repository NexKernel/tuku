import { m } from "framer-motion";
import type { ThinkingPath, TutorStep } from "@/lib/types";
import { stepsFor } from "@/lib/thinking";

/**
 * Qué toca hacer ahora y cuánto falta, en una sola línea compacta.
 * Una meta inmediata clara y el progreso visible apoyan la función ejecutiva infantil,
 * sin quitarle espacio a la conversación.
 */
export function StepIndicator({ current, path }: { current: TutorStep; path?: ThinkingPath }) {
  const steps = stepsFor(path);
  const idx = Math.max(0, steps.findIndex((s) => s.key === current));
  const step = steps[idx];
  const pct = ((idx + 1) / steps.length) * 100;

  return (
    <m.div
      key={step.key}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2.5"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
        <step.icon size={16} strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-tight">
          <span className="font-extrabold text-brand-700 dark:text-brand-300">{step.label}</span>
          <span className="font-semibold text-muted"> · {step.hint}</span>
        </p>
        <div
          className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-500/15"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={idx + 1}
          aria-label={`Paso ${idx + 1} de ${steps.length}`}
        >
          <div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="shrink-0 text-xs font-bold tabular-nums text-muted">
        {idx + 1}/{steps.length}
      </span>
    </m.div>
  );
}
