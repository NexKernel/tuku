import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** Quita Markdown y símbolos para que la voz lea solo el texto. */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/[*_`#>~]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\((Respuesta simulada[^)]*)\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickSpanishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "es-PE") ??
    voices.find((v) => v.lang.startsWith("es-4") || v.lang === "es-MX" || v.lang === "es-US") ??
    voices.find((v) => v.lang.startsWith("es"))
  );
}

/** Lectura en voz alta: clave para niños de 1.º y 2.º que aún no leen con fluidez. */
export function useSpeak() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;
    // Algunas plataformas cargan las voces de forma diferida.
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, [supported]);

  const speak = useCallback(
    (id: string, text: string) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(toPlainText(text));
      const voice = pickSpanishVoice();
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? "es-PE";
      utterance.rate = 0.92; // un poco más lento: comprensión antes que velocidad
      utterance.pitch = 1.1;
      utterance.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
      utterance.onerror = () => setSpeakingId((cur) => (cur === id ? null : cur));
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );

  return { supported, speakingId, speak, stop };
}

// Web Speech API: aún sin tipos estándar en lib.dom.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getRecognitionCtor(): (new () => Recognition) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** Dictado por voz: el niño piensa en voz alta sin depender de escribir. */
export function useDictation(onText: (text: string) => void) {
  const Ctor = getRecognitionCtor();
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  useLayoutEffect(() => {
    onTextRef.current = onText;
  });

  useEffect(() => () => recRef.current?.stop(), []);

  const toggle = useCallback(() => {
    if (!Ctor) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.lang = "es-PE";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript;
      }
      if (text.trim()) onTextRef.current(text.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }, [Ctor, listening]);

  return { supported: !!Ctor, listening, toggle };
}
