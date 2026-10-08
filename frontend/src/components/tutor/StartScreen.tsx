import { Calculator, Compass, Loader2, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { TukuOwl } from "@/components/TukuOwl";
import { useDictation } from "@/hooks/useSpeech";
import { AREAS } from "@/lib/thinking";
import type { Conversation, ThinkingPath } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ConversationList } from "./ConversationList";
import { MicButton } from "./shared";
import { appendText } from "./text";

const GRADES = [
  { grade: 1, age: "6-7 años" },
  { grade: 2, age: "7-8 años" },
  { grade: 3, age: "8-9 años" },
  { grade: 4, age: "9-10 años" },
  { grade: 5, age: "10-11 años" },
  { grade: 6, age: "11-12 años" },
];

/** Caminos a elegir: elegir da sensación de control y evita la fatiga de preguntas. */
const PATH_OPTIONS: { path: ThinkingPath; icon: typeof Zap; title: string; detail: string }[] = [
  { path: "quick", icon: Zap, title: "Reto rápido", detail: "6 pasos · unos 5 minutos" },
  { path: "full", icon: Compass, title: "Reto explorador", detail: "9 pasos · para investigar a fondo" },
  { path: "problem", icon: Calculator, title: "Problema con números", detail: "7 pasos · planeo, calculo y reviso" },
];

/** Pantalla inicial: elegir grado y camino, y plantear la pregunta. */
export function StartScreen({
  problem,
  setProblem,
  grade,
  setGrade,
  path,
  setPath,
  onStart,
  busy,
  error,
  conversations,
  onOpen,
}: {
  problem: string;
  setProblem: (v: string) => void;
  grade: number | undefined;
  setGrade: (g: number) => void;
  path: ThinkingPath;
  setPath: (p: ThinkingPath) => void;
  onStart: () => void;
  busy: boolean;
  error: string | null;
  conversations: Conversation[] | undefined;
  onOpen: (id: string) => void;
}) {
  const [areaSlug, setAreaSlug] = useState(AREAS[0].slug);
  const area = AREAS.find((a) => a.slug === areaSlug) ?? AREAS[0];
  const dictation = useDictation((t) => setProblem(appendText(problem, t)));

  return (
    <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto p-4 text-center sm:p-8">
      <div className="flex flex-col items-center gap-2">
        <TukuOwl mood="wave" size={104} />
        <h2 className="text-2xl font-black sm:text-3xl">¡Hola! Soy Tuku. ¿Qué pensamos hoy?</h2>
        <p className="max-w-md text-base text-muted">
          Cuéntame una pregunta o algo que te dé curiosidad y lo investigamos juntos, como
          detectives. Tú pones las ideas; yo te acompaño con pistas. 🔍✨
        </p>
      </div>

      <div className="w-full max-w-xl space-y-4">
        {/* Grado */}
        <fieldset className="space-y-2">
          <legend className="mx-auto text-sm font-extrabold text-muted">¿En qué grado estás?</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {GRADES.map((g) => (
              <button
                key={g.grade}
                onClick={() => setGrade(g.grade)}
                aria-pressed={grade === g.grade}
                className={cn(
                  "flex flex-col items-center rounded-2xl border-2 px-2 py-1.5 transition",
                  grade === g.grade
                    ? "border-brand-600 bg-brand-600 text-white shadow-pop"
                    : "border-[rgb(var(--border))] hover:border-brand-400",
                )}
              >
                <span className="text-lg font-black leading-tight">{g.grade}.º</span>
                <span className={cn("text-[11px] font-semibold", grade === g.grade ? "text-brand-100" : "text-muted")}>
                  {g.age}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Camino */}
        <fieldset className="space-y-2">
          <legend className="mx-auto text-sm font-extrabold text-muted">¿Cómo quieres pensar hoy?</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {PATH_OPTIONS.map((o) => (
              <button
                key={o.path}
                onClick={() => setPath(o.path)}
                aria-pressed={path === o.path}
                className={cn(
                  "flex items-center gap-2.5 rounded-2xl border-2 p-2.5 text-left transition",
                  path === o.path
                    ? "border-brand-600 bg-brand-500/10"
                    : "border-[rgb(var(--border))] hover:border-brand-400",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    path === o.path ? "bg-brand-600 text-white" : "bg-brand-500/10 text-brand-600 dark:text-brand-300",
                  )}
                >
                  <o.icon size={18} strokeWidth={2.4} />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block text-sm font-black">{o.title}</span>
                  <span className="block text-[11px] font-semibold text-muted">{o.detail}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Pregunta */}
        <div className="relative">
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder={dictation.listening ? "Te escucho… 👂" : "Ej: ¿Por qué el cielo es azul?"}
            aria-label="Tu pregunta o reto"
            rows={3}
            className="input resize-none pr-16 text-left"
          />
          {dictation.supported && (
            <div className="absolute bottom-2 right-2">
              <MicButton listening={dictation.listening} onClick={dictation.toggle} />
            </div>
          )}
        </div>
        {error && <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>}
        <button
          onClick={onStart}
          disabled={busy || problem.trim().length < 3}
          className="btn-primary w-full !min-h-[52px] !text-lg"
        >
          {busy ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
          ¡Empecemos a pensar!
        </button>

        {/* Retos por área */}
        <div className="space-y-2 pt-2 text-left">
          <p className="text-center text-sm font-extrabold text-muted">¿No se te ocurre nada? Elige un reto:</p>
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {AREAS.map((a) => (
              <button
                key={a.slug}
                onClick={() => setAreaSlug(a.slug)}
                aria-pressed={a.slug === areaSlug}
                className={cn(
                  "chip shrink-0",
                  a.slug === areaSlug && "!border-brand-500 !bg-brand-500/10 !text-brand-700 dark:!text-brand-300",
                )}
              >
                <a.icon size={16} />
                {a.name}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {area.challenges.map((c) => (
              <button
                key={c}
                onClick={() => setProblem(c)}
                className="flex items-start gap-2.5 rounded-2xl border-2 border-[rgb(var(--border))] p-3 text-left text-sm font-semibold transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-soft"
              >
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", area.tint)}>
                  <area.icon size={16} />
                </span>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Mis retos (tablet y celular) */}
        {!!conversations?.length && (
          <div className="space-y-2 pt-2 text-left lg:hidden">
            <p className="text-sm font-extrabold text-muted">Sigue con tus retos</p>
            <ConversationList conversations={conversations} onOpen={onOpen} limit={4} />
          </div>
        )}
      </div>
    </div>
  );
}
