import { AnimatePresence, m } from "framer-motion";
import { ArrowUp, BatteryLow, ChevronUp, CircleHelp, Lightbulb, Loader2, Puzzle, X } from "lucide-react";
import { type RefObject, useRef, useState } from "react";
import { useDictation } from "@/hooks/useSpeech";
import { confidenceSteps, isCompleted } from "@/lib/thinking";
import { splitOptions } from "@/lib/tutorText";
import type { ConversationDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MicButton, Stars } from "./shared";
import { CONFIDENCE_OPTIONS, appendText } from "./text";

/** Andamiaje progresivo (zona de desarrollo próximo): de lo mínimo a lo más guiado. */
const HELP_BUTTONS = [
  { level: 1, label: "Aún no sé", icon: CircleHelp, tint: "text-amber-500" },
  { level: 2, label: "Una pista", icon: Lightbulb, tint: "text-yellow-500" },
  { level: 3, label: "Ayúdame", icon: Puzzle, tint: "text-sky-500" },
];

/** Inicios de frase que modelan el lenguaje del pensamiento crítico. */
const THINKING_STARTERS = [
  "Yo pienso que",
  "porque",
  "Lo sé porque",
  "Otra posibilidad es",
  "No estoy seguro, pero",
  "Cambié de idea porque",
];

export interface AdvancePayload {
  message?: string;
  hint_level?: number;
  confidence?: number;
  tired?: boolean;
}

/**
 * Respuesta del niño. Todo lo demás vive en UN panel de ayuda que se abre con un toque:
 * el chat queda limpio y el niño intenta primero con sus palabras.
 */
export function ReplyComposer({
  convo,
  busy,
  error,
  onSend,
}: {
  convo: ConversationDetail | undefined;
  busy: boolean;
  error: string | null;
  /** Devuelve false si el envío falló, para no perder lo que escribió. */
  onSend: (payload: AdvancePayload) => Promise<boolean>;
}) {
  const [reply, setReply] = useState("");
  const [confidence, setConfidence] = useState<number | undefined>();
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const dictation = useDictation((t) => setReply((r) => appendText(r, t)));

  // Ideas para tocar que Tuku ofreció en su último mensaje (menos escribir, menos fatiga).
  const lastMessage = convo?.messages.at(-1);
  const quickOptions =
    !busy && lastMessage?.role === "tutor" ? splitOptions(lastMessage.content).options : [];
  // Las ideas y frases empiezan ocultas: primero el niño intenta con sus palabras (generar
  // una idea propia se recuerda mejor que elegirla). Se abren por mensaje de Tuku, así que
  // vuelven a ocultarse solas con cada mensaje nuevo.
  const [writingHelpFor, setWritingHelpFor] = useState<string | null>(null);
  const writingHelpOpen = !!lastMessage && writingHelpFor === lastMessage.id;
  const askConfidence =
    !!convo && confidenceSteps(convo.path).includes(convo.current_step) && reply.trim().length > 0;

  async function submit() {
    const text = reply;
    if (!text.trim() || busy) return;
    setReply("");
    setConfidence(undefined);
    const ok = await onSend({ message: text, confidence });
    if (!ok) setReply(text); // no se pierde lo que escribió
  }

  function pickWritingHelp(text: string) {
    setReply((r) => `${appendText(r, text)} `);
    setWritingHelpFor(null);
    requestAnimationFrame(() => {
      const el = replyRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  return (
    <div className="space-y-2 border-t border-[rgb(var(--border))] p-3 sm:p-4">
      <AnimatePresence initial={false}>
        {writingHelpOpen && !busy && (
          <HelpPanel
            key="help-panel"
            quickOptions={quickOptions}
            tiredAvailable={!!convo && !isCompleted(convo.current_step)}
            onPick={pickWritingHelp}
            onHide={() => setWritingHelpFor(null)}
            onSend={onSend}
          />
        )}
      </AnimatePresence>

      {!writingHelpOpen && !busy && (
        <HelpToggle ideas={quickOptions.length} onClick={() => setWritingHelpFor(lastMessage?.id ?? null)} />
      )}

      {/* La seguridad se pregunta cuando ya está escribiendo su respuesta, no antes. */}
      {askConfidence && <ConfidencePicker value={confidence} onChange={setConfidence} disabled={busy} />}

      {error && <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>}

      <ReplyInput
        inputRef={replyRef}
        value={reply}
        onChange={setReply}
        onSubmit={submit}
        busy={busy}
        dictation={dictation}
      />
    </div>
  );
}

function HelpToggle({ ideas, onClick }: { ideas: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-expanded={false}
      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full bg-amber-400/15 px-3 text-xs font-bold text-amber-800 ring-1 ring-amber-400/40 transition hover:bg-amber-400/25 dark:text-amber-200 sm:text-sm"
    >
      <Lightbulb size={15} className="text-amber-500" />
      {ideas > 0 ? `Tuku tiene ${ideas} ideas para ti` : "¿Necesitas ayuda?"}
      <ChevronUp size={15} />
    </button>
  );
}

function ReplyInput({
  inputRef,
  value,
  onChange,
  onSubmit,
  busy,
  dictation,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  dictation: ReturnType<typeof useDictation>;
}) {
  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={dictation.listening ? "Te escucho… 👂" : "Escribe tu idea…"}
        aria-label="Tu respuesta"
        rows={1}
        className="input max-h-32 min-h-[48px] resize-none"
      />
      {dictation.supported && (
        <MicButton listening={dictation.listening} onClick={dictation.toggle} disabled={busy} />
      )}
      <button
        onClick={onSubmit}
        disabled={busy || !value.trim()}
        className="btn-primary h-12 w-12 shrink-0 !p-0"
        aria-label="Enviar"
        title="Enviar"
      >
        {busy ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={22} strokeWidth={3} />}
      </button>
    </div>
  );
}

function HelpPanel({
  quickOptions,
  tiredAvailable,
  onPick,
  onHide,
  onSend,
}: {
  quickOptions: string[];
  tiredAvailable: boolean;
  onPick: (text: string) => void;
  onHide: () => void;
  onSend: (payload: AdvancePayload) => Promise<boolean>;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="space-y-2 rounded-2xl bg-[rgb(var(--bg))] p-2.5 ring-1 ring-[rgb(var(--border))]"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold text-muted">
          {quickOptions.length > 0 ? "Ideas de Tuku: toca una" : "Frases para empezar"}
        </p>
        <button
          onClick={onHide}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-brand-500/10"
          aria-label="Ocultar ayudas para escribir"
          title="Ocultar"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {quickOptions.length > 0
          ? quickOptions.map((o) => (
              <button
                key={o}
                onClick={() => onPick(o)}
                className="inline-flex min-h-[40px] items-center rounded-2xl border-2 border-brand-300 bg-brand-500/10 px-3 text-sm font-bold text-brand-700 transition hover:bg-brand-500/20 active:translate-y-0.5 dark:border-brand-700 dark:text-brand-200"
              >
                {o}
              </button>
            ))
          : THINKING_STARTERS.map((t) => (
              <button key={t} onClick={() => onPick(t)} className="chip !py-1 !text-xs">
                {t}…
              </button>
            ))}
      </div>
      <p className="pt-1 text-xs font-extrabold text-muted">¿Necesitas más ayuda?</p>
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 sm:flex-wrap">
        {HELP_BUTTONS.map((h) => (
          <button
            key={h.level}
            onClick={() => onSend({ hint_level: h.level })}
            className="chip min-h-[40px] shrink-0 !text-xs"
          >
            <h.icon size={16} strokeWidth={2.4} className={h.tint} />
            {h.label}
          </button>
        ))}
        {/* Salida digna: mejor acortar el camino que perder al niño. */}
        {tiredAvailable && (
          <button
            onClick={() => onSend({ tired: true })}
            className="chip min-h-[40px] shrink-0 !text-xs"
            title="Tuku acorta el camino y vamos directo a tu conclusión"
          >
            <BatteryLow size={16} strokeWidth={2.4} className="text-rose-500" />
            Me cansé
          </button>
        )}
      </div>
    </m.div>
  );
}

/**
 * Metacognición: decir cuán seguro está antes y después de razonar. Tuku compara ambas
 * en "¿Cómo pensé?". Es opcional para no frenar a quien quiere responder ya.
 */
function ConfidencePicker({
  value,
  onChange,
  disabled,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="flex items-center gap-1.5 rounded-2xl bg-amber-400/10 px-3 py-1.5 sm:py-2">
      <legend className="sr-only">¿Qué tan seguro estás de tu respuesta?</legend>
      <span className="mr-auto text-sm font-extrabold sm:mr-1" aria-hidden>
        <span className="sm:hidden">¿Qué tan seguro?</span>
        <span className="hidden sm:inline">¿Qué tan seguro estás?</span>
      </span>
      {CONFIDENCE_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(value === o.value ? undefined : o.value)}
          disabled={disabled}
          aria-pressed={value === o.value}
          title={o.label}
          className={cn(
            "inline-flex min-h-[36px] items-center gap-1 rounded-full border-2 px-2.5 text-xs font-bold transition",
            value === o.value
              ? "border-amber-500 bg-amber-400 text-amber-950"
              : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:border-amber-400",
          )}
        >
          <Stars count={o.value} />
          {/* En celular solo las estrellas: el espacio es para la conversación. */}
          <span className="hidden sm:inline">{o.label}</span>
        </button>
      ))}
    </fieldset>
  );
}
