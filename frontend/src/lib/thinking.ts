/**
 * Contenido pedagógico compartido por la interfaz de Tuku: pasos del camino de pensamiento,
 * áreas con retos de ejemplo y logros calculados a partir de las conversaciones reales.
 */
import {
  Activity,
  BookOpen,
  Brain,
  BrainCircuit,
  Calculator,
  CheckCheck,
  Compass,
  Flame,
  FlaskConical,
  Footprints,
  Gem,
  Heart,
  Languages,
  Lightbulb,
  ListOrdered,
  type LucideIcon,
  Medal,
  Palette,
  Rocket,
  Ruler,
  ScanSearch,
  Search,
  Sparkles,
  Target,
  Telescope,
  Users,
} from "lucide-react";
import type { Conversation, ThinkingPath, TutorStep } from "@/lib/types";

export interface StepMeta {
  key: TutorStep;
  icon: LucideIcon;
  label: string;
  /** Qué hace el niño ahora, en una frase (orienta la función ejecutiva). */
  hint: string;
}

export const STEPS: StepMeta[] = [
  { key: "curiosity", icon: Sparkles, label: "Curiosidad", hint: "Cuéntale a Tuku lo que ya sabes." },
  { key: "understand", icon: Search, label: "Entender", hint: "Di con tus palabras qué hay que descubrir." },
  { key: "hypothesis", icon: Lightbulb, label: "Mi idea", hint: "Di lo que crees, ¡aunque no estés seguro!" },
  { key: "reasoning", icon: Brain, label: "Razonar", hint: "Explica por qué piensas eso." },
  { key: "evidence", icon: FlaskConical, label: "Pruebas", hint: "¿Cómo podrías comprobarlo?" },
  { key: "perspectives", icon: Users, label: "Otros ojos", hint: "Piensa cómo lo vería otra persona." },
  { key: "conclusion", icon: Target, label: "Conclusión", hint: "Di tu respuesta final y por qué." },
  { key: "metacognition", icon: Footprints, label: "¿Cómo pensé?", hint: "Mira los pasos que diste para pensar." },
  { key: "transfer", icon: Rocket, label: "Nuevo reto", hint: "¡Usa lo que aprendiste en algo nuevo!" },
  // Camino problema
  { key: "estimate", icon: Ruler, label: "Estimar", hint: "Adivina más o menos cuánto saldrá." },
  { key: "plan", icon: ListOrdered, label: "Mi plan", hint: "¿Qué harías primero? Todavía sin hacer cuentas." },
  { key: "solve", icon: Calculator, label: "Calcular", hint: "Ahora haz tú las cuentas." },
  { key: "check", icon: CheckCheck, label: "¿Tiene sentido?", hint: "Revisa tu resultado: ¿cuadra con el problema?" },
];

const BY_KEY = new Map(STEPS.map((s) => [s.key, s]));

/** Orden de cada camino (igual que `prompts.PATHS` del backend). */
const PATH_KEYS: Record<ThinkingPath, TutorStep[]> = {
  full: [
    "curiosity", "understand", "hypothesis", "reasoning", "evidence",
    "perspectives", "conclusion", "metacognition", "transfer",
  ],
  quick: ["understand", "hypothesis", "reasoning", "conclusion", "metacognition", "transfer"],
  problem: ["understand", "estimate", "plan", "solve", "check", "metacognition", "transfer"],
};

function keysFor(path: ThinkingPath | undefined): TutorStep[] {
  return PATH_KEYS[path ?? "full"] ?? PATH_KEYS.full;
}

export function stepsFor(path: ThinkingPath | undefined): StepMeta[] {
  return keysFor(path).map((k) => BY_KEY.get(k)!);
}

/** Pasos donde el niño marca cuán seguro está (primera idea y respuesta final). */
export function confidenceSteps(path: ThinkingPath | undefined): TutorStep[] {
  return path === "problem" ? ["estimate", "check"] : ["hypothesis", "conclusion"];
}

/** Dos o más números en el enunciado: se propone el camino problema (igual que el backend). */
export function looksLikeNumberProblem(text: string): boolean {
  return (text.match(/\d+(?:[.,]\d+)?/g) ?? []).length >= 2;
}

/** Posición del paso actual dentro del camino del reto (para "Paso X de N"). */
export function progressOf(c: Pick<Conversation, "current_step" | "path">) {
  const steps = stepsFor(c.path);
  return { index: Math.max(0, steps.findIndex((s) => s.key === c.current_step)), total: steps.length };
}

/**
 * ¿El niño ya completó alguno de `steps` (es decir, avanzó más allá)? Cada camino tiene
 * sus propios pasos: se pasan los equivalentes, p. ej. "hypothesis" y "estimate".
 */
export function hasDone(
  c: Pick<Conversation, "current_step" | "path">,
  ...steps: TutorStep[]
): boolean {
  const keys = keysFor(c.path);
  const current = keys.indexOf(c.current_step);
  return steps.some((s) => {
    const i = keys.indexOf(s);
    return i !== -1 && current > i;
  });
}

export function isCompleted(step: TutorStep): boolean {
  return step === "transfer";
}

export interface Area {
  slug: string;
  name: string;
  icon: LucideIcon;
  /** Clases de color del área (fondo suave + texto), legibles en claro y oscuro. */
  tint: string;
  challenges: string[];
}

// Mismas áreas que el seed del backend (CNEB primaria + pensamiento crítico).
export const AREAS: Area[] = [
  {
    slug: "pensamiento-critico",
    name: "Pensamiento Crítico",
    icon: Brain,
    tint: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
    challenges: [
      "Un anuncio dice: «9 de cada 10 niños prefieren este cereal». ¿Le creo?",
      "Mi amigo dice que los murciélagos son pájaros porque vuelan. ¿Tiene razón?",
      "¿Es justo que el más alto del salón siempre se siente atrás?",
    ],
  },
  {
    slug: "matematica",
    name: "Matemática",
    icon: Calculator,
    tint: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    challenges: [
      "Tengo 24 caramelos para repartir entre 5 amigos. ¿Cómo lo hago justo?",
      "¿Es verdad que un número con más cifras siempre es más grande?",
      "¿Qué pesa más: un kilo de algodón o un kilo de piedras?",
    ],
  },
  {
    slug: "comunicacion",
    name: "Comunicación",
    icon: BookOpen,
    tint: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300",
    challenges: [
      "¿Cómo sé si una noticia que vi en internet es verdad?",
      "¿Por qué un mismo cuento puede tener finales distintos?",
    ],
  },
  {
    slug: "ciencia-tecnologia",
    name: "Ciencia y Tecnología",
    icon: FlaskConical,
    tint: "bg-teal-500/15 text-teal-600 dark:text-teal-300",
    challenges: [
      "¿Los peces duermen? ¿Cómo podríamos saberlo?",
      "¿Por qué las hojas de los árboles se caen?",
      "¿Las plantas necesitan luz para crecer? ¿Cómo lo probarías?",
    ],
  },
  {
    slug: "personal-social",
    name: "Personal Social",
    icon: Users,
    tint: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    challenges: [
      "¿Qué hace que una regla sea justa?",
      "¿Por qué en la costa, la sierra y la selva se come distinto?",
    ],
  },
  {
    slug: "arte-cultura",
    name: "Arte y Cultura",
    icon: Palette,
    tint: "bg-pink-500/15 text-pink-600 dark:text-pink-300",
    challenges: [
      "¿Un dibujo tiene que parecerse a la realidad para ser bonito?",
      "¿Por qué los colores nos hacen sentir cosas distintas?",
    ],
  },
  {
    slug: "educacion-fisica",
    name: "Educación Física",
    icon: Activity,
    tint: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    challenges: [
      "¿Por qué el corazón late más rápido cuando corremos?",
      "¿Qué es mejor: ganar o jugar limpio?",
    ],
  },
  {
    slug: "ingles",
    name: "Inglés",
    icon: Languages,
    tint: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300",
    challenges: [
      "¿Por qué en inglés se dice «red car» y no «car red»?",
      "¿Hay palabras que se parecen en inglés y en castellano? ¿Por qué?",
    ],
  },
  {
    slug: "educacion-religiosa",
    name: "Educación Religiosa",
    icon: Heart,
    tint: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
    challenges: [
      "¿Qué significa ser un buen amigo?",
      "¿Está bien decir una mentira para no hacer sentir mal a alguien?",
    ],
  },
];

/** El reto del día cambia cada día y es el mismo para toda la clase. */
export function dailyChallenge(date = new Date()): { area: Area; text: string } {
  const all = AREAS.flatMap((area) => area.challenges.map((text) => ({ area, text })));
  const day = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(2026, 0, 1)) /
      86_400_000,
  );
  return all[((day % all.length) + all.length) % all.length];
}

export interface Badge {
  id: string;
  icon: LucideIcon;
  name: string;
  description: string;
  /** Clase del color del icono cuando está desbloqueado. */
  color: string;
  progress: number;
  goal: number;
}

/** Logros calculados con datos reales; premian el proceso de pensar, no competir. */
export function computeBadges(conversations: Conversation[], reviewsDone = 0): Badge[] {
  const started = conversations.length;
  const done = (...steps: TutorStep[]) => conversations.filter((c) => hasDone(c, ...steps)).length;
  const completed = conversations.filter((c) => isCompleted(c.current_step)).length;
  const days = new Set(conversations.map((c) => c.created_at.slice(0, 10))).size;

  return [
    { id: "first", icon: Rocket, name: "Primer vuelo", description: "Empieza tu primer reto", color: "text-sky-500", progress: started, goal: 1 },
    { id: "curious", icon: Telescope, name: "Curiosidad", description: "Empieza 3 retos", color: "text-violet-500", progress: started, goal: 3 },
    { id: "idea", icon: Lightbulb, name: "Tengo una idea", description: "Di tu propia idea en un reto", color: "text-amber-500", progress: done("hypothesis", "estimate"), goal: 1 },
    { id: "detective", icon: ScanSearch, name: "Detective", description: "Busca pruebas para tu idea", color: "text-teal-500", progress: done("evidence", "check"), goal: 1 },
    { id: "open-mind", icon: Users, name: "Mente abierta", description: "Piensa como otra persona", color: "text-pink-500", progress: done("perspectives"), goal: 1 },
    { id: "thinker", icon: Medal, name: "Gran pensador", description: "Completa un reto entero", color: "text-emerald-500", progress: completed, goal: 1 },
    { id: "memory", icon: BrainCircuit, name: "Buena memoria", description: "Haz 3 repasos con Tuku", color: "text-indigo-500", progress: reviewsDone, goal: 3 },
    { id: "streak", icon: Flame, name: "Constancia", description: "Piensa con Tuku en 3 días distintos", color: "text-orange-500", progress: days, goal: 3 },
    { id: "explorer", icon: Compass, name: "Explorador", description: "Empieza 10 retos", color: "text-cyan-500", progress: started, goal: 10 },
    { id: "master", icon: Gem, name: "Maestro del pensar", description: "Completa 5 retos", color: "text-fuchsia-500", progress: completed, goal: 5 },
  ].map((b) => ({ ...b, progress: Math.min(b.progress, b.goal) }));
}
