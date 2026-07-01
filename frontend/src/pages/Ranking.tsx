import { Trophy } from "lucide-react";

const MOCK = [
  { name: "Ana Quispe", xp: 4820, streak: 21 },
  { name: "Luis Rojas", xp: 4310, streak: 14 },
  { name: "María Ccahua", xp: 3990, streak: 9 },
  { name: "Tú", xp: 1240, streak: 5 },
];

export function Ranking() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Ranking semanal</h1>
        <p className="text-sm text-muted">Compite con tu academia y sube de posición.</p>
      </div>
      <div className="card divide-y divide-[rgb(var(--border))]">
        {MOCK.map((r, i) => (
          <div key={r.name} className="flex items-center gap-4 p-4">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                i === 0 ? "bg-amber-400/20 text-amber-400" : "bg-[rgb(var(--border))] text-muted"
              }`}
            >
              {i === 0 ? <Trophy size={16} /> : i + 1}
            </span>
            <div className="flex-1">
              <p className="font-semibold">{r.name}</p>
              <p className="text-xs text-muted">🔥 {r.streak} días de racha</p>
            </div>
            <span className="font-bold text-brand-400">{r.xp.toLocaleString()} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}
