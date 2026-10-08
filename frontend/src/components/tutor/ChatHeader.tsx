import { GraduationCap, Plus, Volume2, VolumeX } from "lucide-react";
import { StepIndicator } from "@/components/StepIndicator";
import type { ConversationDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Cabecera del reto: título, grado, voz y camino. */
export function ChatHeader({
  convo,
  canSpeak,
  autoRead,
  onToggleAutoRead,
  onNew,
}: {
  convo: ConversationDetail | undefined;
  canSpeak: boolean;
  autoRead: boolean;
  onToggleAutoRead: () => void;
  onNew: () => void;
}) {
  return (
    <div className="space-y-2 border-b border-[rgb(var(--border))] px-3 py-2.5 sm:px-4">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-base font-extrabold">{convo?.title}</p>
        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 sm:flex">
          <GraduationCap size={14} />
          {convo?.grade ? `${convo.grade}.º grado` : "Primaria"}
        </span>
        {canSpeak && (
          <button
            onClick={onToggleAutoRead}
            className={cn("btn-ghost !min-h-[40px] !px-2.5", autoRead && "!text-brand-600 dark:!text-brand-300")}
            aria-pressed={autoRead}
            title={autoRead ? "Tuku lee en voz alta (activado)" : "Tuku lee en voz alta (desactivado)"}
          >
            {autoRead ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span className="hidden sm:inline">Voz</span>
          </button>
        )}
        <button
          onClick={onNew}
          className="btn-ghost !min-h-[40px] !px-2.5 lg:hidden"
          aria-label="Nuevo reto"
          title="Nuevo reto"
        >
          <Plus size={20} strokeWidth={2.6} />
        </button>
      </div>
      {convo && <StepIndicator current={convo.current_step} path={convo.path} />}
    </div>
  );
}
