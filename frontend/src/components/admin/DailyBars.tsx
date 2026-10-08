import { useState } from "react";
import type { AdminDayPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

const fmt = new Intl.NumberFormat("es-PE");
const dayFmt = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", timeZone: "UTC" });

/** Tope "limpio" del eje: 1, 2, 5 × 10^n por encima del máximo. */
function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 5, 10].find((m) => m * p >= v) ?? 10) * p;
}

const W = 600;
const H = 160;
const PAD_L = 36;
const PAD_B = 18;
const GAP = 2; // espacio en color de superficie entre barras vecinas

/**
 * Columnas por día de UNA serie (sin leyenda: el título dice qué se mide).
 * Hover/tap en cualquier punto de la franja del día muestra el valor exacto.
 */
export function DailyBars({
  data,
  metric,
  label,
  colorClass,
}: {
  data: AdminDayPoint[];
  metric: "registrations" | "tokens";
  label: string;
  /** Clase `fill-*` del color de la serie (con su variante dark). */
  colorClass: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const values = data.map((d) => d[metric]);
  const max = niceMax(Math.max(...values, 0));
  const plotW = W - PAD_L;
  const plotH = H - PAD_B;
  const band = plotW / Math.max(data.length, 1);
  const barW = Math.min(24, band - GAP);
  const y = (v: number) => plotH - (v / max) * (plotH - 6);

  const point = hover !== null ? data[hover] : null;
  const tipPct = hover !== null ? ((PAD_L + (hover + 0.5) * band) / W) * 100 : 0;

  return (
    <figure className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`${label} por día, últimos ${data.length} días`}
        onMouseLeave={() => setHover(null)}
      >
        {/* Rejilla recesiva: base, mitad (solo si es un número entero) y tope */}
        {(Number.isInteger(max / 2) ? [0, 0.5, 1] : [0, 1]).map((f) => (
          <g key={f}>
            <line
              x1={PAD_L}
              x2={W}
              y1={y(max * f)}
              y2={y(max * f)}
              className="stroke-[rgb(var(--border))]"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 6}
              y={y(max * f) + 3}
              textAnchor="end"
              className="fill-[rgb(var(--muted))] text-[10px] font-semibold"
            >
              {fmt.format(Math.round(max * f))}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const v = d[metric];
          const x = PAD_L + i * band + (band - barW) / 2;
          const top = y(v);
          const h = plotH - top;
          const r = Math.min(4, h, barW / 2);
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
              {/* Zona de contacto: toda la franja del día, más grande que la barra */}
              <rect x={PAD_L + i * band} y={0} width={band} height={plotH} fill="transparent" />
              {v > 0 && (
                <path
                  // Extremo de datos redondeado (4px), base recta sobre el eje.
                  d={`M${x},${plotH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${plotH} Z`}
                  className={cn(colorClass, "transition-opacity", hover !== null && hover !== i && "opacity-40")}
                />
              )}
            </g>
          );
        })}

        {/* Fechas solo en los extremos: el tooltip da el resto */}
        {[0, data.length - 1].map((i) =>
          data[i] ? (
            <text
              key={i}
              x={PAD_L + i * band + band / 2}
              y={H - 4}
              textAnchor={i === 0 ? "start" : "end"}
              className="fill-[rgb(var(--muted))] text-[10px] font-semibold"
            >
              {dayFmt.format(new Date(data[i].day))}
            </text>
          ) : null,
        )}
      </svg>

      {point && (
        <div
          className={cn(
            "pointer-events-none absolute top-0 z-10 whitespace-nowrap rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1.5 text-xs shadow-soft",
            // En los bordes se ancla hacia dentro para no desbordar la tarjeta.
            tipPct > 75 ? "-translate-x-full" : tipPct < 25 ? "" : "-translate-x-1/2",
          )}
          style={{ left: `${tipPct}%` }}
        >
          <p className="font-semibold text-muted">{dayFmt.format(new Date(point.day))}</p>
          <p className="font-black">
            {fmt.format(point[metric])} {label.toLowerCase()}
          </p>
        </div>
      )}

      {/* Vista de tabla para lectores de pantalla */}
      <table className="sr-only">
        <caption>{label} por día</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <th scope="row">{d.day}</th>
              <td>{d[metric]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
