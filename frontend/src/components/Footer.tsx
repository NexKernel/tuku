import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "51970660969";

/** Logo de WhatsApp (lucide no incluye logos de marcas). */
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.93.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.46 9.48-9.46 2.53 0 4.9.99 6.7 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.45-9.47 9.45zm8.06-17.52A11.32 11.32 0 0 0 12.04.65C5.76.65.65 5.75.65 12.03c0 2 .52 3.96 1.52 5.69L.55 23.6l6.03-1.58a11.37 11.37 0 0 0 5.45 1.39h.01c6.28 0 11.39-5.1 11.39-11.38 0-3.04-1.18-5.9-3.33-8.05z" />
    </svg>
  );
}

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-4 text-xs font-semibold text-muted",
        className,
      )}
    >
      <span className="flex items-center gap-1">
        Desarrollado con
        <Heart size={14} className="fill-rose-500 text-rose-500" aria-label="amor" />
        por <span className="font-black text-[rgb(var(--text))]">Nexkernel</span>
      </span>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        aria-label="Escríbenos por WhatsApp al 970 660 969"
      >
        <WhatsAppIcon />
        970 660 969
      </a>
    </footer>
  );
}
