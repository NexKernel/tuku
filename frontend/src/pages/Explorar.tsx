import { m } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AREAS, CYCLES, cycleOfGrade, loadGrade, type Cycle } from "@/lib/thinking";
import { cn } from "@/lib/utils";

/** Áreas del CNEB de primaria con retos por ciclo para empezar a pensar con Tuku. */
export function Explorar() {
  const navigate = useNavigate();
  // Empieza en el ciclo del grado que el niño eligió; "todos" si aún no eligió.
  const [cycle, setCycle] = useState<Cycle | undefined>(() => cycleOfGrade(loadGrade()));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-black">Explorar</h1>
        <p className="text-base text-muted">
          Retos de las áreas del Currículo Nacional. Elige uno: ¡Tuku te acompaña a pensarlo!
        </p>
      </div>

      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Grado">
        {[{ cycle: undefined, label: "Todos" }, ...CYCLES].map((c) => (
          <button
            key={c.label}
            onClick={() => setCycle(c.cycle)}
            aria-pressed={cycle === c.cycle}
            className={cn(
              "chip shrink-0",
              cycle === c.cycle && "!border-brand-500 !bg-brand-500/10 !text-brand-700 dark:!text-brand-300",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((area, i) => (
          <m.section
            key={area.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="card flex flex-col p-5"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", area.tint)}>
                <area.icon size={24} strokeWidth={2.4} />
              </span>
              <h2 className="text-lg font-black leading-tight">{area.name}</h2>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {area.challenges
                .filter((c) => !cycle || c.cycle === cycle)
                .map((c) => (
                  <button
                    key={c.text}
                    onClick={() => navigate("/tutor", { state: { problem: c.text } })}
                    className="group flex items-center gap-2 rounded-2xl bg-[rgb(var(--bg))] px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-brand-500/10"
                  >
                    <span className="flex-1">
                      {c.text}
                      <span className="mt-0.5 block text-[11px] font-semibold text-muted">
                        {c.competency}
                        {!cycle && ` · ${CYCLES.find((x) => x.cycle === c.cycle)?.label}`}
                      </span>
                    </span>
                    <ChevronRight
                      size={18}
                      className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-600"
                    />
                  </button>
                ))}
            </div>
          </m.section>
        ))}
      </div>
    </div>
  );
}
