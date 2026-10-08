import { m } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AREAS } from "@/lib/thinking";
import { cn } from "@/lib/utils";

/** Áreas de primaria con preguntas abiertas para empezar a pensar con Tuku. */
export function Explorar() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-black">Explorar</h1>
        <p className="text-base text-muted">Elige un área y un reto. ¡Tuku te acompaña a pensarlo!</p>
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
              {area.challenges.map((c) => (
                <button
                  key={c}
                  onClick={() => navigate("/tutor", { state: { problem: c } })}
                  className="group flex items-center gap-2 rounded-2xl bg-[rgb(var(--bg))] px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-brand-500/10"
                >
                  <span className="flex-1">{c}</span>
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
