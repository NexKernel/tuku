import { motion } from "framer-motion";
import type { TutorStep } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS: { key: TutorStep; label: string }[] = [
  { key: "detect_topic", label: "Tema" },
  { key: "detect_subtopic", label: "Subtema" },
  { key: "detect_difficulty", label: "Dificultad" },
  { key: "detect_competencies", label: "Competencias" },
  { key: "extract_data", label: "Datos" },
  { key: "explain_strategy", label: "Estrategia" },
  { key: "socratic_questions", label: "Preguntas" },
  { key: "await_response", label: "Tu turno" },
  { key: "feedback", label: "Feedback" },
  { key: "solve", label: "Resolver" },
  { key: "short_method", label: "Método corto" },
  { key: "elimination_method", label: "Descarte" },
  { key: "common_error", label: "Error típico" },
  { key: "similar_exercise", label: "Similar" },
  { key: "register_performance", label: "Desempeño" },
];

/** Barra visual del flujo Socrático de 15 pasos. */
export function StepIndicator({ current }: { current: TutorStep }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <motion.div
              initial={false}
              animate={{ scale: active ? 1.05 : 1 }}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition",
                active && "bg-brand-600 text-white shadow-glow",
                done && "bg-brand-500/15 text-brand-400",
                !active && !done && "bg-[rgb(var(--border))] text-muted",
              )}
            >
              <span className="tabular-nums opacity-70">{i + 1}</span>
              {s.label}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
