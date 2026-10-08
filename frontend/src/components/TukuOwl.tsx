import { m } from "framer-motion";
import { cn } from "@/lib/utils";

export type TukuMood = "happy" | "thinking" | "celebrate" | "wave";

interface Props {
  mood?: TukuMood;
  size?: number;
  className?: string;
  /** Desactiva el balanceo (útil en avatares pequeños dentro de listas). */
  still?: boolean;
}

const BODY = "#A47148";
const BODY_DARK = "#7C5232";
const FACE = "#F3DFC1";
const BELLY = "#F7E8D0";
const BEAK = "#F59E0B";
const INK = "#2B1B10";

/** Tuku, el búho ("tuku" en quechua). Ilustración propia para que se vea igual en todos los dispositivos. */
export function TukuOwl({ mood = "happy", size = 64, className, still = false }: Props) {
  // Hacia dónde mira: pensando, mira arriba a un lado.
  const look = mood === "thinking" ? { x: 3, y: -4 } : { x: 0, y: 0 };
  const eyesClosed = mood === "celebrate";
  const leftWingUp = mood === "celebrate";
  const rightWingUp = mood === "celebrate" || mood === "wave";

  return (
    <m.svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label="Tuku, el búho"
      className={cn("shrink-0 overflow-visible", className)}
      animate={still ? undefined : mood === "celebrate" ? { y: [0, -8, 0] } : { y: [0, -2, 0] }}
      transition={{
        duration: mood === "celebrate" ? 0.6 : 2.4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Penachos */}
      <path d="M30 36 L22 10 L48 27 Z" fill={BODY_DARK} />
      <path d="M90 36 L98 10 L72 27 Z" fill={BODY_DARK} />

      {/* Alas (detrás del cuerpo) */}
      <m.path
        d="M26 58 C12 72 16 92 32 102 C34 86 34 72 26 58 Z"
        fill={BODY_DARK}
        // Origen relativo a la caja del ala: el hombro.
        style={{ originX: 0.75, originY: 0.05 }}
        animate={{ rotate: leftWingUp ? [100, 130, 100] : 0 }}
        transition={{ duration: 0.5, repeat: leftWingUp ? Infinity : 0 }}
      />
      <m.path
        d="M94 58 C108 72 104 92 88 102 C86 86 86 72 94 58 Z"
        fill={BODY_DARK}
        style={{ originX: 0.25, originY: 0.05 }}
        animate={{ rotate: rightWingUp ? [-100, -130, -100] : 0 }}
        transition={{ duration: 0.5, repeat: rightWingUp ? Infinity : 0 }}
      />

      {/* Cuerpo y pancita */}
      <ellipse cx="60" cy="66" rx="38" ry="44" fill={BODY} />
      <ellipse cx="60" cy="84" rx="23" ry="22" fill={BELLY} />
      <path d="M50 80 q5 5 10 0 q5 5 10 0" stroke={BODY} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M48 90 q6 5 12 0 q6 5 12 0" stroke={BODY} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Antifaz */}
      <circle cx="44" cy="48" r="18" fill={FACE} />
      <circle cx="76" cy="48" r="18" fill={FACE} />

      {/* Ojos */}
      {eyesClosed ? (
        <g stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M35 51 q9 -10 18 0" />
          <path d="M67 51 q9 -10 18 0" />
        </g>
      ) : (
        <>
          <circle cx="44" cy="48" r="12" fill="#fff" />
          <circle cx="76" cy="48" r="12" fill="#fff" />
          <m.g
            animate={{ scaleY: [1, 1, 0.1, 1] }}
            transition={{ duration: 4, times: [0, 0.92, 0.96, 1], repeat: Infinity }}
          >
            <circle cx={44 + look.x} cy={48 + look.y} r="6.5" fill={INK} />
            <circle cx={76 + look.x} cy={48 + look.y} r="6.5" fill={INK} />
            <circle cx={46 + look.x} cy={45 + look.y} r="2.2" fill="#fff" />
            <circle cx={78 + look.x} cy={45 + look.y} r="2.2" fill="#fff" />
          </m.g>
        </>
      )}

      {/* Mejillas */}
      <circle cx="31" cy="60" r="4" fill="#F9A8D4" opacity="0.7" />
      <circle cx="89" cy="60" r="4" fill="#F9A8D4" opacity="0.7" />

      {/* Pico */}
      <path d="M53 58 L67 58 L60 69 Z" fill={BEAK} />

      {/* Patitas */}
      <ellipse cx="48" cy="110" rx="7" ry="3.5" fill={BEAK} />
      <ellipse cx="72" cy="110" rx="7" ry="3.5" fill={BEAK} />
    </m.svg>
  );
}
