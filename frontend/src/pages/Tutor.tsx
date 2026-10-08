import { AnimatePresence } from "framer-motion";
import { Medal, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Celebration } from "@/components/tutor/Celebration";
import { ChatHeader } from "@/components/tutor/ChatHeader";
import { ConversationList } from "@/components/tutor/ConversationList";
import { MessageList, type PendingReply } from "@/components/tutor/MessageList";
import { ReplyComposer, type AdvancePayload } from "@/components/tutor/ReplyComposer";
import { StartScreen } from "@/components/tutor/StartScreen";
import { useSpeak } from "@/hooks/useSpeech";
import {
  useAdvance,
  useConversation,
  useConversations,
  useStartConversation,
} from "@/hooks/useTutor";
import { apiError } from "@/lib/api";
import { isCompleted, looksLikeNumberProblem } from "@/lib/thinking";
import { splitOptions } from "@/lib/tutorText";
import type { ConversationDetail, ThinkingPath } from "@/lib/types";

const GRADE_KEY = "tuku.grade";
const AUTOREAD_KEY = "tuku.autoread";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* almacenamiento no disponible: la preferencia vale solo para esta visita */
  }
}

function loadGrade(): number | undefined {
  const v = Number(readStorage(GRADE_KEY));
  return v >= 1 && v <= 6 ? v : undefined;
}

interface TutorLocationState {
  problem?: string;
  conversationId?: string;
}

/** Celebración al completar el camino durante la sesión (no al abrir un reto ya completo). */
function useCompletionCelebration(convo: ConversationDetail | undefined) {
  const [celebrate, setCelebrate] = useState(false);
  const prevStepRef = useRef<{ convoId?: string; step?: string }>({});
  useEffect(() => {
    if (!convo) return;
    const prev = prevStepRef.current;
    prevStepRef.current = { convoId: convo.id, step: convo.current_step };
    if (prev.convoId === convo.id && prev.step !== convo.current_step && isCompleted(convo.current_step)) {
      setCelebrate(true);
    }
  }, [convo]);
  // El cierre depende solo de `celebrate`: si `convo` cambia durante la animación (un
  // refetch), antes se cancelaba el timer y la capa se quedaba encima para siempre.
  useEffect(() => {
    if (!celebrate) return;
    const t = setTimeout(() => setCelebrate(false), 3500);
    return () => clearTimeout(t);
  }, [celebrate]);
  return [celebrate, () => setCelebrate(false)] as const;
}

export function Tutor() {
  const location = useLocation();
  const initial = (location.state ?? {}) as TutorLocationState;

  const [activeId, setActiveId] = useState<string | undefined>(initial.conversationId);
  const [problem, setProblem] = useState(initial.problem ?? "");
  // Respuesta enviada que aún espera a Tuku: se muestra al instante en el chat.
  const [pendingReply, setPendingReply] = useState<PendingReply | null>(null);
  const [grade, setGrade] = useState<number | undefined>(loadGrade);
  const [pathChoice, setPathChoice] = useState<ThinkingPath | undefined>();
  // Sin elección: problema con números → camino problema; 1.º-2.º → rápido (igual que el backend).
  const path: ThinkingPath =
    pathChoice ??
    (looksLikeNumberProblem(problem) ? "problem" : grade !== undefined && grade <= 2 ? "quick" : "full");
  const [autoRead, setAutoRead] = useState<boolean>(() => {
    const saved = readStorage(AUTOREAD_KEY);
    return saved === null ? (loadGrade() ?? 3) <= 2 : saved === "1";
  });
  const [error, setError] = useState<string | null>(null);

  const { data: conversations } = useConversations();
  const { data: convo, isLoading } = useConversation(activeId);
  const start = useStartConversation();
  const advance = useAdvance(activeId ?? "");
  const { supported: canSpeak, speakingId, speak, stop } = useSpeak();
  const [celebrate, closeCelebration] = useCompletionCelebration(convo);

  const busy = start.isPending || advance.isPending;

  // Lee en voz alta cada mensaje nuevo de Tuku (no los antiguos al abrir un reto).
  const seenRef = useRef<{ convoId?: string; msgId?: string }>({});
  const lastTutor = convo?.messages.filter((msg) => msg.role === "tutor").at(-1);
  useEffect(() => {
    if (!convo || !lastTutor) return;
    const seen = seenRef.current;
    if (seen.convoId === convo.id && seen.msgId !== lastTutor.id && autoRead) {
      speak(lastTutor.id, splitOptions(lastTutor.content).text);
    }
    seenRef.current = { convoId: convo.id, msgId: lastTutor.id };
  }, [convo, lastTutor, autoRead, speak]);

  function openConversation(id: string | undefined) {
    stop();
    setError(null);
    setActiveId(id);
  }

  function chooseGrade(g: number) {
    setGrade(g);
    writeStorage(GRADE_KEY, String(g));
  }

  function toggleAutoRead() {
    const next = !autoRead;
    setAutoRead(next);
    writeStorage(AUTOREAD_KEY, next ? "1" : "0");
    if (!next) stop();
  }

  async function startProblem() {
    if (problem.trim().length < 3) return;
    setError(null);
    try {
      const created = await start.mutateAsync({ problem, grade, path });
      setActiveId(created.id);
      setProblem("");
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function send(payload: AdvancePayload): Promise<boolean> {
    if (!activeId) return false;
    setError(null);
    stop();
    if (payload.message) setPendingReply({ text: payload.message, confidence: payload.confidence });
    try {
      await advance.mutateAsync(payload);
      return true;
    } catch (err) {
      setError(apiError(err));
      return false;
    } finally {
      setPendingReply(null);
    }
  }

  return (
    <div className="mx-auto grid h-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
      {/* Mis retos (escritorio) */}
      <aside className="hidden min-h-0 flex-col lg:flex">
        <button onClick={() => openConversation(undefined)} className="btn-primary mb-3 w-full">
          <Plus size={18} strokeWidth={3} /> Nuevo reto
        </button>
        <p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wide text-muted">Mis retos</p>
        <ConversationList conversations={conversations} activeId={activeId} onOpen={openConversation} />
      </aside>

      {/* Panel del tutor */}
      <div className="card relative flex min-h-0 flex-col overflow-hidden">
        {!activeId ? (
          <StartScreen
            problem={problem}
            setProblem={setProblem}
            grade={grade}
            setGrade={chooseGrade}
            path={path}
            setPath={setPathChoice}
            onStart={startProblem}
            busy={busy}
            error={error}
            conversations={conversations}
            onOpen={openConversation}
          />
        ) : (
          <>
            <ChatHeader
              convo={convo}
              canSpeak={canSpeak}
              autoRead={autoRead}
              onToggleAutoRead={toggleAutoRead}
              onNew={() => openConversation(undefined)}
            />
            <MessageList
              messages={convo?.messages}
              pendingReply={pendingReply}
              busy={busy}
              isLoading={isLoading}
              speech={{ canSpeak, speakingId, speak, stop }}
            />
            {convo && isCompleted(convo.current_step) && (
              <CompletedBanner onNew={() => openConversation(undefined)} />
            )}
            {/* key: cada reto empieza con su propio borrador y sin seguridad elegida. */}
            <ReplyComposer key={activeId} convo={convo} busy={busy} error={error} onSend={send} />
          </>
        )}

        <AnimatePresence>{celebrate && <Celebration onClose={closeCelebration} />}</AnimatePresence>
      </div>
    </div>
  );
}

function CompletedBanner({ onNew }: { onNew: () => void }) {
  return (
    <div className="mx-3 mb-1 flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-3 py-1.5 ring-1 ring-emerald-500/30 sm:mx-4 sm:gap-3 sm:py-2">
      <Medal className="shrink-0 text-emerald-600 dark:text-emerald-400" size={24} />
      <p className="flex-1 text-sm font-bold">
        ¡Camino completo!
        <span className="hidden sm:inline"> Responde el nuevo reto o empieza otro.</span>
      </p>
      <button onClick={onNew} className="btn-ghost !min-h-[36px] shrink-0 !text-emerald-700 dark:!text-emerald-300">
        <Plus size={16} /> Otro reto
      </button>
    </div>
  );
}
