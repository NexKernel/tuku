import { m } from "framer-motion";
import { Lock } from "lucide-react";
import { TukuOwl } from "@/components/TukuOwl";
import { useConversations, useReviews } from "@/hooks/useTutor";
import { computeBadges } from "@/lib/thinking";
import { cn } from "@/lib/utils";

/**
 * Logros personales. A esta edad la comparación social (rankings) desplaza la motivación
 * intrínseca; aquí cada niño solo se compara consigo mismo y se premia el proceso de pensar.
 */
export function Logros() {
  const { data: conversations = [], isLoading } = useConversations();
  const { data: reviews } = useReviews();
  const badges = computeBadges(conversations, reviews?.completed ?? 0);
  const unlocked = badges.filter((b) => b.progress >= b.goal).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="card flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <TukuOwl mood={unlocked ? "celebrate" : "happy"} size={88} />
        <div className="flex-1">
          <h1 className="text-3xl font-black">Mis logros</h1>
          <p className="text-base text-muted">
            {unlocked
              ? `¡Ya tienes ${unlocked} de ${badges.length} medallas! Cada una es un paso de pensador.`
              : "Gana medallas pensando con Tuku. ¡La primera está a un reto de distancia!"}
          </p>
        </div>
        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-3xl bg-amber-400/20 text-amber-700 dark:text-amber-300">
          <span className="text-3xl font-black leading-none">{unlocked}</span>
          <span className="text-xs font-bold">de {badges.length}</span>
        </div>
      </section>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {badges.map((b, i) => {
            const done = b.progress >= b.goal;
            return (
              <m.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "card flex flex-col items-center gap-2 p-4 text-center",
                  !done && "bg-[rgb(var(--bg))] shadow-none",
                )}
              >
                <span
                  className={cn(
                    "relative flex h-16 w-16 items-center justify-center rounded-full",
                    done ? "bg-amber-400/20 ring-4 ring-amber-400/30" : "bg-[rgb(var(--border))]",
                  )}
                >
                  <b.icon size={30} strokeWidth={2.2} className={done ? b.color : "text-muted opacity-50"} />
                  {!done && (
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--surface))] text-muted shadow-soft">
                      <Lock size={12} />
                    </span>
                  )}
                </span>
                <p className="font-black leading-tight">{b.name}</p>
                <p className="text-xs font-semibold text-muted">{b.description}</p>
                {b.goal > 1 && (
                  <div className="mt-auto w-full space-y-1">
                    <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--border))]">
                      <div
                        className={cn("h-full rounded-full", done ? "bg-amber-400" : "bg-brand-500")}
                        style={{ width: `${(b.progress / b.goal) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-bold text-muted">
                      {b.progress} / {b.goal}
                    </p>
                  </div>
                )}
              </m.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
