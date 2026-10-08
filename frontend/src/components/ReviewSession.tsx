import { useQueryClient } from "@tanstack/react-query";
import { m } from "framer-motion";
import { ArrowUp, BrainCircuit, Loader2, Mic, Rocket, Square, Users, Volume2, X } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MathMarkdown } from "@/components/MathMarkdown";
import { TukuOwl } from "@/components/TukuOwl";
import { useDictation, useSpeak } from "@/hooks/useSpeech";
import { useAnswerReview, useStartReview } from "@/hooks/useTutor";
import { apiError } from "@/lib/api";
import { splitOptions } from "@/lib/tutorText";
import type { Review } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Cada ronda pide un tipo de recuperación más profundo que la anterior. */
const ROUNDS: Record<number, { icon: typeof BrainCircuit; label: string }> = {
  1: { icon: BrainCircuit, label: "Recordar" },
  2: { icon: Rocket, label: "Usarlo en algo nuevo" },
  3: { icon: Users, label: "Enseñárselo a un amigo" },
};

/**
 * Repaso espaciado: Tuku trae de vuelta un reto de días atrás para que el niño
 * lo recupere de su memoria (no lo relea). Así se consolida a largo plazo.
 */
export function ReviewSession({ reviews, onClose }: { reviews: Review[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [index, setIndex] = useState(0);
  const [current, setCurrent] = useState<Review | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const start = useStartReview();
  const send = useAnswerReview();
  const { supported: canSpeak, speakingId, speak, stop } = useSpeak();
  const dictation = useDictation((t) => setAnswer((a) => (a.trim() ? `${a.trimEnd()} ${t}` : t)));
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);

  const review = reviews[index];
  const isLast = index === reviews.length - 1;
  const round = ROUNDS[review.round] ?? ROUNDS[1];
  const startReview = start.mutateAsync;

  useEffect(() => {
    setCurrent(null);
    setAnswer("");
    setError(null);
    startReview(review.id)
      .then((r) => {
        setCurrent(r);
        requestAnimationFrame(() => inputRef.current?.focus());
      })
      .catch((err) => setError(apiError(err)));
  }, [review.id, startReview]);

  function close() {
    stop();
    qc.invalidateQueries({ queryKey: ["reviews"] });
    onClose();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function submit() {
    // El ref cierra la ventana entre el clic y el re-render con isPending (doble clic/Enter).
    if (!current || !answer.trim() || sendingRef.current) return;
    sendingRef.current = true;
    setError(null);
    stop();
    try {
      setCurrent(await send.mutateAsync({ id: current.id, answer: answer.trim() }));
    } catch (err) {
      setError(apiError(err));
    } finally {
      sendingRef.current = false;
    }
  }

  const done = !!current?.feedback;

  // En un portal: así ningún contenedor (márgenes, transforms) desplaza el modal.
  return createPortal(
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={close}
    >
      <m.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="card flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-b-none sm:rounded-b-3xl"
      >
        <ReviewHeader
          round={round}
          title={review.conversation_title}
          position={reviews.length > 1 ? `${index + 1} de ${reviews.length}` : null}
          onClose={close}
        />

        {/* Conversación del repaso */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {!current && !error && (
            <div className="flex items-end gap-2" role="status">
              <TukuOwl mood="thinking" size={48} />
              <p className="pb-2 text-sm font-bold text-muted">Tuku está buscando en su memoria…</p>
            </div>
          )}

          {current?.question && (
            <TukuSays
              id={`${current.id}-q`}
              text={splitOptions(current.question).text}
              canSpeak={canSpeak}
              speakingId={speakingId}
              speak={speak}
              stop={stop}
            />
          )}

          {current?.answer && (
            <div className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-tr-md bg-brand-600 px-4 py-3 text-white">
                {current.answer}
              </p>
            </div>
          )}

          {send.isPending && (
            <div className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-tr-md bg-brand-600 px-4 py-3 text-white opacity-80">
                {answer}
              </p>
            </div>
          )}

          {current?.feedback && (
            <TukuSays
              id={`${current.id}-f`}
              text={splitOptions(current.feedback).text}
              mood="celebrate"
              canSpeak={canSpeak}
              speakingId={speakingId}
              speak={speak}
              stop={stop}
            />
          )}

          {error && <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>}
        </div>

        {/* Pie: responder o seguir */}
        <div className="border-t border-[rgb(var(--border))] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {done ? (
            <button
              onClick={() => (isLast ? close() : setIndex((i) => i + 1))}
              className="btn-primary w-full !min-h-[52px] !text-lg"
              autoFocus
            >
              {isLast ? "¡Terminé de repasar! 🎉" : "Siguiente recuerdo →"}
            </button>
          ) : (
            <AnswerComposer
              inputRef={inputRef}
              answer={answer}
              onChange={setAnswer}
              onSubmit={submit}
              ready={!!current}
              pending={send.isPending}
              dictation={dictation}
            />
          )}
        </div>
      </m.div>
    </m.div>,
    document.body,
  );
}

function ReviewHeader({
  round,
  title,
  position,
  onClose,
}: {
  round: (typeof ROUNDS)[number];
  title: string;
  position: string | null;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-300">
        <round.icon size={22} strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p id="review-title" className="text-xs font-extrabold uppercase tracking-wide text-brand-700 dark:text-brand-300">
          Repaso · {round.label}
        </p>
        <p className="truncate text-sm font-bold">{title}</p>
      </div>
      {position && <span className="shrink-0 text-xs font-bold text-muted">{position}</span>}
      <button onClick={onClose} className="btn-ghost !min-h-[40px] !px-2" aria-label="Cerrar">
        <X size={20} />
      </button>
    </div>
  );
}

function AnswerComposer({
  inputRef,
  answer,
  onChange,
  onSubmit,
  ready,
  pending,
  dictation,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  answer: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  ready: boolean;
  pending: boolean;
  dictation: ReturnType<typeof useDictation>;
}) {
  const disabled = !ready || pending;
  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={inputRef}
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!pending) onSubmit();
          }
        }}
        disabled={disabled}
        placeholder={dictation.listening ? "Te escucho… 👂" : "Lo que recuerdas…"}
        aria-label="Tu respuesta al repaso"
        rows={2}
        className="input max-h-32 resize-none"
      />
      {dictation.supported && (
        <button
          onClick={dictation.toggle}
          disabled={disabled}
          aria-pressed={dictation.listening}
          aria-label={dictation.listening ? "Dejar de escuchar" : "Hablar en vez de escribir"}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 transition disabled:opacity-50",
            dictation.listening
              ? "border-rose-500 bg-rose-500 text-white"
              : "border-[rgb(var(--border))] text-muted hover:border-brand-400",
          )}
        >
          <Mic size={22} />
        </button>
      )}
      <button
        onClick={onSubmit}
        disabled={disabled || !answer.trim()}
        className="btn-primary h-12 w-12 shrink-0 !p-0"
        aria-label="Enviar"
      >
        {pending ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={22} strokeWidth={3} />}
      </button>
    </div>
  );
}

function TukuSays({
  id,
  text,
  mood = "happy",
  canSpeak,
  speakingId,
  speak,
  stop,
}: {
  id: string;
  text: string;
  mood?: "happy" | "celebrate";
  canSpeak: boolean;
  speakingId: string | null;
  speak: (id: string, text: string) => void;
  stop: () => void;
}) {
  return (
    <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2">
      <TukuOwl mood={mood} size={40} still={mood === "happy"} className="mt-1" />
      <div className="max-w-[85%]">
        <div className="surface rounded-3xl rounded-tl-md px-4 py-3 shadow-soft">
          <MathMarkdown content={text} />
        </div>
        {canSpeak && (
          <button
            onClick={() => (speakingId === id ? stop() : speak(id, text))}
            className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-muted hover:bg-brand-500/10"
          >
            {speakingId === id ? (
              <>
                <Square size={12} fill="currentColor" /> Detener
              </>
            ) : (
              <>
                <Volume2 size={14} /> Escuchar
              </>
            )}
          </button>
        )}
      </div>
    </m.div>
  );
}
