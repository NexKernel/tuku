import { m } from "framer-motion";
import { Star } from "lucide-react";
import { TukuOwl } from "@/components/TukuOwl";

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
