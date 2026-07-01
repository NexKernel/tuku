import { motion } from "framer-motion";
import {
  ArrowUp,
  Lightbulb,
  Loader2,
  Plus,
  Sparkles,
  Timer,
  Wand2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MathMarkdown } from "@/components/MathMarkdown";
import { StepIndicator } from "@/components/StepIndicator";
import {
  useAdvance,
  useConversation,
  useConversations,
  useStartConversation,
} from "@/hooks/useTutor";
import { apiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export function Tutor() {
  const [activeId, setActiveId] = useState<string | undefined>();
  const [problem, setProblem] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: conversations } = useConversations();
  const { data: convo, isLoading } = useConversation(activeId);
  const start = useStartConversation();
  const advance = useAdvance(activeId ?? "");

  const busy = start.isPending || advance.isPending;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [convo?.messages.length, busy]);

  async function startProblem() {
    if (problem.trim().length < 3) return;
    setError(null);
    try {
      const created = await start.mutateAsync({ problem });
      setActiveId(created.id);
      setProblem("");
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function send(payload: { message?: string; hint_level?: number }) {
    if (!activeId) return;
    setError(null);
    try {
      await advance.mutateAsync(payload);
      setReply("");
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <div className="mx-auto grid h-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
      {/* Historial */}
      <aside className="hidden lg:block">
        <button
          onClick={() => setActiveId(undefined)}
          className="btn-primary mb-3 w-full"
        >
          <Plus size={16} /> Nuevo problema
        </button>
        <div className="space-y-1">
          {conversations?.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "w-full truncate rounded-xl px-3 py-2 text-left text-sm transition",
                activeId === c.id
                  ? "bg-brand-500/15 font-medium text-brand-400"
                  : "text-muted hover:bg-brand-500/10",
              )}
            >
              {c.title}
            </button>
          ))}
          {!conversations?.length && (
            <p className="px-3 text-xs text-muted">Aún no tienes problemas resueltos.</p>
          )}
        </div>
      </aside>

      {/* Panel del copiloto */}
      <div className="card flex min-h-0 flex-col overflow-hidden">
        {!activeId ? (
          <EmptyState
            problem={problem}
            setProblem={setProblem}
            onStart={startProblem}
            busy={busy}
            error={error}
          />
        ) : (
          <>
            {/* Cabecera con flujo */}
            <div className="border-b border-[rgb(var(--border))] p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="truncate font-semibold">{convo?.title}</p>
                <span className="flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-400">
                  <Timer size={13} /> {convo?.detected_difficulty ?? "—"}
                </span>
              </div>
              {convo && <StepIndicator current={convo.current_step} />}
            </div>

            {/* Mensajes */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {isLoading && <div className="skeleton h-24" />}
              {convo?.messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      m.role === "user"
                        ? "bg-brand-600 text-white"
                        : "surface shadow-soft",
                    )}
                  >
                    {m.role === "tutor" ? (
                      <MathMarkdown content={m.content} />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Loader2 size={15} className="animate-spin" /> El mentor está pensando…
                </div>
              )}
            </div>

            {/* Acciones + composer */}
            <div className="space-y-3 border-t border-[rgb(var(--border))] p-4">
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => send({ hint_level: lvl })}
                    disabled={busy}
                    className="btn-ghost text-xs"
                  >
                    <Lightbulb size={14} /> Pista {lvl}
                  </button>
                ))}
                <button
                  onClick={() => send({})}
                  disabled={busy}
                  className="btn-ghost text-xs"
                >
                  <Wand2 size={14} /> Siguiente paso
                </button>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex items-end gap-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (reply.trim()) send({ message: reply });
                    }
                  }}
                  placeholder="Escribe tu razonamiento… (Enter para enviar)"
                  rows={1}
                  className="input max-h-32 min-h-[44px] resize-none"
                />
                <button
                  onClick={() => reply.trim() && send({ message: reply })}
                  disabled={busy || !reply.trim()}
                  className="btn-primary h-11 w-11 !p-0"
                >
                  <ArrowUp size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  problem,
  setProblem,
  onStart,
  busy,
  error,
}: {
  problem: string;
  setProblem: (v: string) => void;
  onStart: () => void;
  busy: boolean;
  error: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow">
        <Sparkles size={28} />
      </div>
      <div>
        <h2 className="text-2xl font-extrabold">¿Qué problema resolvemos hoy?</h2>
        <p className="mt-1 max-w-md text-sm text-muted">
          Pega tu ejercicio. No te daré la respuesta de inmediato: te guiaré paso a paso
          para que la descubras tú.
        </p>
      </div>
      <div className="w-full max-w-xl space-y-3">
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Ej: Si 2x + 3 = 15, ¿cuál es el valor de x² − 1?"
          rows={4}
          className="input resize-none text-left"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button onClick={onStart} disabled={busy || problem.trim().length < 3} className="btn-primary w-full">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Empezar con el tutor
        </button>
      </div>
    </div>
  );
}
