import { m } from "framer-motion";
import { Star } from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import { TukuOwl } from "@/components/TukuOwl";

const CONFETTI_COLORS = ["#f59e0b", "#ec4899", "#0ea5e9", "#10b981", "#8b5cf6", "#f43f5e", "#facc15"];

/** Lluvia de confeti en CSS puro (sin librería): cada pieza con color, tamaño y giro propios. */
function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const size = 6 + Math.random() * 6;
        const round = i % 3 === 0;
        return {
          left: `${Math.random() * 100}%`,
          width: size,
          height: round ? size : size * 0.45,
          borderRadius: round ? "9999px" : "2px",
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          "--delay": `${Math.random() * 0.6}s`,
          "--fall": `${2.2 + Math.random() * 1.4}s`,
          "--drift": `${(Math.random() - 0.5) * 160}px`,
          "--spin": `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540)}deg`,
        } as CSSProperties;
      }),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((style, i) => (
        <span key={i} className="confetti-piece" style={style} />
      ))}
    </div>
  );
}

/** Celebración breve: refuerza el esfuerzo de recorrer todo el camino. Un toque la cierra. */
export function Celebration({ onClose }: { onClose: () => void }) {
  const stars = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    return { x: Math.cos(angle) * 140, y: Math.sin(angle) * 110, delay: (i % 4) * 0.05 };
  });
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // Sin backdrop-blur: en Chrome Android / Safari iOS la capa difuminada no se repinta al
      // desvanecerse y la pantalla queda opaca hasta que el niño desliza.
      className="absolute inset-0 z-20 flex items-center justify-center bg-[rgb(var(--surface)/0.92)]"
      role="status"
      onClick={onClose}
    >
      <Confetti />
      <div className="relative flex flex-col items-center gap-2 text-center">
        {stars.map((s, i) => (
          <m.span
            key={i}
            className="absolute text-amber-400"
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x: s.x, y: s.y, scale: 1, opacity: [1, 1, 0] }}
            transition={{ duration: 1.4, delay: s.delay, ease: "easeOut" }}
          >
            <Star size={22} fill="currentColor" />
          </m.span>
        ))}
        <TukuOwl mood="celebrate" size={120} />
        <p className="text-2xl font-black">¡Lo lograste!</p>
        <p className="max-w-xs text-sm font-semibold text-muted">
          Pensaste como un científico. ¡Ganaste una medalla de pensador! 🏅
        </p>
      </div>
    </m.div>
  );
}
