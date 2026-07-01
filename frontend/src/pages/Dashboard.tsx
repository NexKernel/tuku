import { motion } from "framer-motion";
import {
  Clock,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSubjects } from "@/hooks/useTutor";
import { useAuthStore } from "@/store/auth";

const STATS = [
  { icon: Clock, label: "Tiempo estudiado", value: "18h 42m", tint: "text-sky-400" },
  { icon: Target, label: "Precisión", value: "78%", tint: "text-emerald-400" },
  { icon: Zap, label: "Velocidad media", value: "1m 12s", tint: "text-amber-400" },
  { icon: Trophy, label: "Ranking", value: "#12", tint: "text-brand-400" },
];

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: subjects, isLoading } = useSubjects();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Bienvenida */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Bienvenido de vuelta,</p>
          <h1 className="text-3xl font-extrabold">
            {user?.full_name?.split(" ")[0] ?? "Estudiante"} 👋
          </h1>
        </div>
        <Link to="/tutor" className="btn-primary">
          <Sparkles size={16} /> Nuevo problema con el tutor
        </Link>
      </div>

      {/* Progreso de nivel */}
      <div className="card flex flex-wrap items-center gap-6 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-xl font-extrabold text-white shadow-glow">
            3
          </div>
          <div>
            <p className="font-bold">Nivel 3 · Aprendiz avanzado</p>
            <p className="text-sm text-muted">1.240 / 2.000 XP para el siguiente nivel</p>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-2">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[rgb(var(--border))]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "62%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
            />
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-orange-400">
            <Flame size={16} /> 5 días
          </span>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-5"
          >
            <s.icon className={s.tint} size={22} />
            <p className="mt-3 text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Materias + Recomendaciones */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Materias</h2>
            <Link to="/materias" className="text-sm text-brand-500 hover:underline">
              Ver todas
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-16" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {subjects?.slice(0, 9).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] p-3 text-sm font-medium transition hover:border-brand-500 hover:shadow-soft"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: s.color ?? "#6366f1" }}
                  />
                  {s.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <TrendingUp size={18} className="text-brand-500" /> Recomendaciones IA
          </h2>
          {[
            "Refuerza Trigonometría: identidades pitagóricas.",
            "Tu velocidad en RM bajó 12%. Practica series.",
            "Racha de 5 días 🔥 ¡No la pierdas hoy!",
          ].map((r) => (
            <div
              key={r}
              className="rounded-xl bg-brand-500/5 p-3 text-sm text-muted ring-1 ring-brand-500/10"
            >
              {r}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
