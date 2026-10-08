import { AnimatePresence, m } from "framer-motion";
import {
  Award,
  Brain,
  CalendarDays,
  ChevronRight,
  FlaskConical,
  Footprints,
  Lightbulb,
  Medal,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ReviewSession } from "@/components/ReviewSession";
import { TukuOwl } from "@/components/TukuOwl";
import { useConversations, useReviews } from "@/hooks/useTutor";
import { computeBadges, dailyChallenge, hasDone, isCompleted, progressOf } from "@/lib/thinking";
import type { TutorStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

/** Habilidades de pensamiento crítico; se "encienden" cuando el niño las usa en un reto. */
// Pasos equivalentes en cada camino (explorador/rápido y problema con números).
const SUPERPOWERS: { icon: typeof Brain; label: string; steps: TutorStep[]; tint: string }[] = [
  { icon: Sparkles, label: "Preguntar", steps: ["curiosity", "understand"], tint: "text-violet-500" },
  { icon: Lightbulb, label: "Tener ideas", steps: ["hypothesis", "estimate"], tint: "text-amber-500" },
  { icon: Brain, label: "Razonar", steps: ["reasoning", "plan"], tint: "text-pink-500" },
  { icon: FlaskConical, label: "Buscar pruebas", steps: ["evidence", "check"], tint: "text-teal-500" },
  { icon: Users, label: "Ver otros puntos de vista", steps: ["perspectives"], tint: "text-sky-500" },
  { icon: Footprints, label: "Mirar cómo pienso", steps: ["metacognition"], tint: "text-emerald-500" },
];

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data: conversations = [], isLoading } = useConversations();
  const { data: reviews } = useReviews();
  const [reviewing, setReviewing] = useState(false);
  const dueReviews = reviews?.due ?? [];

  const firstName = user?.full_name?.split(" ")[0] ?? "pensador";
  const today = dailyChallenge();
  const pending = conversations.find((c) => !isCompleted(c.current_step));
  const completed = conversations.filter((c) => isCompleted(c.current_step)).length;
  const days = new Set(conversations.map((c) => c.created_at.slice(0, 10))).size;
  const badges = computeBadges(conversations, reviews?.completed ?? 0);
  const unlocked = badges.filter((b) => b.progress >= b.goal).length;
  const pendingProgress = pending && progressOf(pending);

  const stats = [
    { icon: Rocket, label: "Retos empezados", value: conversations.length, tint: "bg-sky-500/15 text-sky-600 dark:text-sky-300" },
    { icon: Medal, label: "Retos completados", value: completed, tint: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
    { icon: CalendarDays, label: "Días pensando", value: days, tint: "bg-orange-500/15 text-orange-600 dark:text-orange-300" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Saludo */}
      <section className="card flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:p-6 sm:text-left">
        <TukuOwl mood="wave" size={92} />
        <div className="flex-1">
          <h1 className="text-2xl font-black sm:text-3xl">¡Hola, {firstName}! 👋</h1>
          <p className="text-base text-muted">¿Listo para entrenar tu cerebro hoy? Cada pregunta lo hace más fuerte.</p>
        </div>
        <Link to="/tutor" className="btn-primary w-full !min-h-[52px] !text-lg sm:w-auto">
          <Sparkles size={20} /> Pensar con Tuku
        </Link>
      </section>

      {/* Repaso espaciado: recuperar de la memoria lo aprendido días atrás */}
      {dueReviews.length > 0 && (
        <m.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 rounded-3xl bg-amber-400/15 p-5 text-center ring-2 ring-amber-400/40 sm:flex-row sm:text-left"
        >
          <TukuOwl mood="thinking" size={72} />
          <div className="flex-1">
            <h2 className="text-xl font-black">¡Tuku quiere recordarte algo! 🧠</h2>
            <p className="text-sm font-semibold text-muted">
              Recordar lo que pensaste hace unos días hace que tu cerebro lo guarde mucho mejor.
            </p>
          </div>
          <button onClick={() => setReviewing(true)} className="btn-primary w-full !min-h-[52px] sm:w-auto">
            Repasar {dueReviews.length > 1 ? `(${dueReviews.length})` : ""}
          </button>
        </m.section>
      )}
      <AnimatePresence>
        {reviewing && dueReviews.length > 0 && (
          <ReviewSession reviews={dueReviews} onClose={() => setReviewing(false)} />
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Reto del día */}
        <m.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-fuchsia-700 p-6 text-white shadow-glow lg:col-span-3"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wide">
            <today.area.icon size={14} /> Reto del día · {today.area.name}
          </span>
          <p className="mt-4 text-xl font-extrabold leading-snug sm:text-2xl">{today.text}</p>
          <button
            onClick={() => navigate("/tutor", { state: { problem: today.text } })}
            className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-white px-5 font-extrabold text-brand-700 shadow-pop transition hover:bg-brand-50 active:translate-y-0.5"
          >
            ¡Acepto el reto! <ChevronRight size={20} strokeWidth={3} />
          </button>
          <Sparkles className="absolute -right-4 -top-4 text-white/10" size={140} aria-hidden />
        </m.section>

        {/* Seguir */}
        <section className="card flex flex-col p-5 lg:col-span-2">
          <h2 className="mb-3 text-lg font-black">Sigue donde te quedaste</h2>
          {isLoading ? (
            <div className="skeleton h-20" />
          ) : pending ? (
            <button
              onClick={() => navigate("/tutor", { state: { conversationId: pending.id } })}
              className="flex flex-1 flex-col justify-between gap-3 rounded-2xl border-2 border-[rgb(var(--border))] p-4 text-left transition hover:border-brand-400"
            >
              <p className="line-clamp-2 font-bold">{pending.title}</p>
              <div className="w-full space-y-1.5">
                <div className="h-2.5 overflow-hidden rounded-full bg-[rgb(var(--border))]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                    style={{ width: `${(((pendingProgress?.index ?? 0) + 1) / (pendingProgress?.total ?? 1)) * 100}%` }}
                  />
                </div>
                <p className="flex items-center justify-between text-xs font-bold text-muted">
                  Paso {(pendingProgress?.index ?? 0) + 1} de {pendingProgress?.total}
                  <span className="text-brand-600 dark:text-brand-300">Continuar →</span>
                </p>
              </div>
            </button>
          ) : (
            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-brand-500/5 p-4 text-sm text-muted">
              <TukuOwl mood="thinking" size={48} still />
              No tienes retos a medias. ¡Prueba el reto del día!
            </div>
          )}
        </section>
      </div>

      {/* Números reales */}
      <section className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <m.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card flex flex-col items-center gap-1 p-4 text-center sm:flex-row sm:gap-3 sm:text-left"
          >
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", s.tint)}>
              <s.icon size={22} strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-2xl font-black leading-none">{s.value}</p>
              <p className="text-xs font-semibold text-muted">{s.label}</p>
            </div>
          </m.div>
        ))}
      </section>

      {/* Superpoderes */}
      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black">Tus superpoderes de pensamiento</h2>
            <p className="text-sm text-muted">Se encienden cuando los usas en un reto.</p>
          </div>
          <Link to="/logros" className="chip">
            <Award size={16} className="text-amber-500" /> {unlocked} de {badges.length} logros
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SUPERPOWERS.map((p) => {
            const on = conversations.some((c) => hasDone(c, ...p.steps));
            return (
              <div
                key={p.label}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition",
                  on ? "border-transparent bg-brand-500/10" : "border-dashed border-[rgb(var(--border))] opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full",
                    on ? "bg-[rgb(var(--surface))] shadow-soft" : "bg-[rgb(var(--border))]",
                  )}
                >
                  <p.icon size={24} strokeWidth={2.4} className={on ? p.tint : "text-muted"} />
                </span>
                <span className="text-xs font-bold leading-tight">{p.label}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
