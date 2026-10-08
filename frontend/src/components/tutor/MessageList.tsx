import { m } from "framer-motion";
import { Square, Volume2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { MathMarkdown } from "@/components/MathMarkdown";
import { TukuOwl } from "@/components/TukuOwl";
import { splitOptions } from "@/lib/tutorText";
import type { Message } from "@/lib/types";
import { Stars } from "./shared";
import { CONFIDENCE_OPTIONS } from "./text";

export interface PendingReply {
  text: string;
  confidence?: number;
}

interface SpeechControls {
  canSpeak: boolean;
  speakingId: string | null;
  speak: (id: string, text: string) => void;
  stop: () => void;
}

/** La conversación: mensajes de Tuku y del niño, la respuesta en camino y "pensando". */
export function MessageList({
  messages,
  pendingReply,
  busy,
  isLoading,
  speech,
}: {
  messages: Message[] | undefined;
  pendingReply: PendingReply | null;
  busy: boolean;
  isLoading: boolean;
  speech: SpeechControls;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages?.length, busy, pendingReply]);

  // Si el panel se achica (aparece el aviso de "Camino completo", el teclado del celular, las
  // opciones…) y el niño estaba al final, lo mantiene al final: si no, el último mensaje queda
  // tapado y hay que deslizar para verlo.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let lastHeight = el.clientHeight;
    const observer = new ResizeObserver(() => {
      const shrunk = el.clientHeight < lastHeight;
      const wasAtBottom = el.scrollHeight - el.scrollTop - lastHeight < 80;
      lastHeight = el.clientHeight;
      if (shrunk && wasAtBottom) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-3 sm:p-5" aria-live="polite">
      {isLoading && <div className="skeleton h-24" />}
      {messages?.map((msg) =>
        msg.role === "tutor" ? (
          <TutorMessage key={msg.id} message={msg} speech={speech} />
        ) : (
          <m.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <UserBubble text={msg.content} confidence={msg.confidence} />
          </m.div>
        ),
      )}
      {pendingReply && (
        <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <UserBubble text={pendingReply.text} confidence={pendingReply.confidence} />
        </m.div>
      )}
      {busy && <ThinkingBubble />}
    </div>
  );
}

function TutorMessage({ message, speech }: { message: Message; speech: SpeechControls }) {
  const { canSpeak, speakingId, speak, stop } = speech;
  const text = splitOptions(message.content).text;
  const speaking = speakingId === message.id;
  return (
    <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2">
      <TukuOwl size={38} still className="mt-1 hidden sm:block" />
      <div className="max-w-[92%] sm:max-w-[80%]">
        <div className="surface rounded-3xl rounded-tl-md px-4 py-3 shadow-soft">
          <MathMarkdown content={text} />
        </div>
        {canSpeak && (
          <button
            onClick={() => (speaking ? stop() : speak(message.id, text))}
            className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-muted transition hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300"
          >
            {speaking ? (
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

function UserBubble({ text, confidence }: { text: string; confidence?: number | null }) {
  return (
    <div className="max-w-[88%] rounded-3xl rounded-tr-md bg-brand-600 px-4 py-3 text-base text-white shadow-soft sm:max-w-[75%]">
      <p className="whitespace-pre-wrap">{text}</p>
      {!!confidence && (
        <p className="mt-1.5 flex items-center justify-end gap-1 text-xs font-bold text-brand-100">
          <Stars count={confidence} className="[&_svg]:!text-amber-300" />
          {CONFIDENCE_OPTIONS.find((o) => o.value === confidence)?.label}
        </p>
      )}
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex items-end gap-2" role="status">
      <TukuOwl mood="thinking" size={44} />
      <div className="surface flex items-center gap-1.5 rounded-3xl rounded-bl-md px-4 py-3 shadow-soft">
        <span className="mr-1 text-sm font-bold text-muted">Tuku está pensando</span>
        {[0, 1, 2].map((i) => (
          <m.span
            key={i}
            className="h-2 w-2 rounded-full bg-brand-500"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
