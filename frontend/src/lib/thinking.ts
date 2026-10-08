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
  MonitorSmartphone,
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

/** Ciclos de primaria del CNEB: III (1.º-2.º), IV (3.º-4.º) y V (5.º-6.º). */
export type Cycle = "III" | "IV" | "V";

export const CYCLES: { cycle: Cycle; label: string; grades: [number, number] }[] = [
  { cycle: "III", label: "1.º y 2.º", grades: [1, 2] },
  { cycle: "IV", label: "3.º y 4.º", grades: [3, 4] },
  { cycle: "V", label: "5.º y 6.º", grades: [5, 6] },
];

export function cycleOfGrade(grade: number | undefined): Cycle | undefined {
  return CYCLES.find(({ grades: [a, b] }) => grade !== undefined && grade >= a && grade <= b)?.cycle;
}

export interface Challenge {
  text: string;
  cycle: Cycle;
  /** Competencia del CNEB que trabaja el reto (para el docente). */
  competency: string;
}

export interface Area {
  slug: string;
  name: string;
  icon: LucideIcon;
  /** Clases de color del área (fondo suave + texto), legibles en claro y oscuro. */
  tint: string;
  challenges: Challenge[];
}

// Competencias del CNEB (Currículo Nacional de la Educación Básica, primaria).
const C = {
  identidad: "Construye su identidad",
  convive: "Convive y participa democráticamente",
  historia: "Construye interpretaciones históricas",
  ambiente: "Gestiona responsablemente el espacio y el ambiente",
  economia: "Gestiona responsablemente los recursos económicos",
  motricidad: "Se desenvuelve de manera autónoma a través de su motricidad",
  saludable: "Asume una vida saludable",
  sociomotriz: "Interactúa a través de sus habilidades sociomotrices",
  oral: "Se comunica oralmente en su lengua materna",
  lee: "Lee diversos tipos de textos escritos",
  escribe: "Escribe diversos tipos de textos",
  aprecia: "Aprecia de manera crítica manifestaciones artístico-culturales",
  crea: "Crea proyectos desde los lenguajes artísticos",
  oralIngles: "Se comunica oralmente en inglés",
  leeIngles: "Lee diversos tipos de textos en inglés",
  escribeIngles: "Escribe diversos tipos de textos en inglés",
  cantidad: "Resuelve problemas de cantidad",
  regularidad: "Resuelve problemas de regularidad, equivalencia y cambio",
  forma: "Resuelve problemas de forma, movimiento y localización",
  datos: "Resuelve problemas de gestión de datos e incertidumbre",
  indaga: "Indaga mediante métodos científicos",
  explica: "Explica el mundo físico basándose en conocimientos científicos",
  disena: "Diseña y construye soluciones tecnológicas",
  religionIdentidad: "Construye su identidad como persona humana, amada por Dios",
  religionVida: "Asume la experiencia del encuentro con Dios en su proyecto de vida",
  tic: "Se desenvuelve en entornos virtuales generados por las TIC",
  autonomo: "Gestiona su aprendizaje de manera autónoma",
} as const;

// Mismas áreas que el seed del backend: las del CNEB de primaria + competencias transversales.
export const AREAS: Area[] = [
  {
    slug: "matematica",
    name: "Matemática",
    icon: Calculator,
    tint: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    challenges: [
      { cycle: "III", competency: C.cantidad, text: "Tengo 8 caramelos y mi hermano tiene 5. ¿Cuántos le doy para que tengamos igual?" },
      { cycle: "III", competency: C.regularidad, text: "En un collar van: rojo, azul, azul, rojo, azul, azul… ¿De qué color será la cuenta 10?" },
      { cycle: "IV", competency: C.cantidad, text: "Tengo 24 caramelos para repartir entre 5 amigos. ¿Cómo lo hago justo?" },
      { cycle: "IV", competency: C.forma, text: "¿Un cuadrado también es un rectángulo? ¿Por qué?" },
      { cycle: "V", competency: C.regularidad, text: "¿Es lo mismo 1/2 que 2/4 de una pizza? ¿Cómo lo demostrarías?" },
      { cycle: "V", competency: C.datos, text: "En mi salón, a 18 de 30 niños les gusta el fútbol. ¿Puedo decir que a la mayoría de niños del Perú también?" },
    ],
  },
  {
    slug: "comunicacion",
    name: "Comunicación",
    icon: BookOpen,
    tint: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300",
    challenges: [
      { cycle: "III", competency: C.lee, text: "En el cuento, el lobo se come a la abuelita. ¿El lobo es malo o tenía hambre?" },
      { cycle: "III", competency: C.oral, text: "¿Por qué cuando una historia pasa de boca en boca, termina cambiando?" },
      { cycle: "IV", competency: C.lee, text: "¿Cómo sé si una noticia que vi en internet es verdad?" },
      { cycle: "IV", competency: C.escribe, text: "¿Por qué un mismo cuento puede tener finales distintos?" },
      { cycle: "V", competency: C.lee, text: "Un afiche dice «el mejor helado del Perú». ¿Es un hecho o una opinión?" },
      { cycle: "V", competency: C.escribe, text: "Quiero convencer al director de tener más tiempo de recreo. ¿Qué razones usaría?" },
    ],
  },
  {
    slug: "personal-social",
    name: "Personal Social",
    icon: Users,
    tint: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    challenges: [
      { cycle: "III", competency: C.identidad, text: "¿Qué cosas me hacen especial y qué cosas comparto con mis compañeros?" },
      { cycle: "III", competency: C.convive, text: "Todos quieren la misma pelota en el recreo. ¿Cómo lo decidimos de forma justa?" },
      { cycle: "IV", competency: C.historia, text: "¿Cómo sabemos cómo vivían los incas si en esa época no había fotos?" },
      { cycle: "IV", competency: C.ambiente, text: "¿Por qué en la costa, la sierra y la selva se come distinto?" },
      { cycle: "V", competency: C.economia, text: "Me regalaron una propina. ¿Me compro algo hoy o ahorro? ¿Por qué?" },
      { cycle: "V", competency: C.historia, text: "Dos personas cuentan distinto cómo fue la independencia del Perú. ¿Cómo sé a quién creerle?" },
    ],
  },
  {
    slug: "ciencia-tecnologia",
    name: "Ciencia y Tecnología",
    icon: FlaskConical,
    tint: "bg-teal-500/15 text-teal-600 dark:text-teal-300",
    challenges: [
      { cycle: "III", competency: C.indaga, text: "¿Las plantas necesitan luz para crecer? ¿Cómo lo probarías?" },
      { cycle: "III", competency: C.explica, text: "¿Por qué el hielo se derrite cuando lo saco de la refri?" },
      { cycle: "IV", competency: C.explica, text: "¿Los peces duermen? ¿Cómo podríamos saberlo?" },
      { cycle: "IV", competency: C.indaga, text: "¿Qué se seca más rápido: la ropa al sol o a la sombra? ¿Cómo lo compruebas?" },
      { cycle: "V", competency: C.explica, text: "Si la sierra está más alta y más cerca del sol, ¿por qué hace más frío?" },
      { cycle: "V", competency: C.disena, text: "¿Cómo podríamos juntar agua de lluvia en el colegio sin que se ensucie?" },
    ],
  },
  {
    slug: "arte-cultura",
    name: "Arte y Cultura",
    icon: Palette,
    tint: "bg-pink-500/15 text-pink-600 dark:text-pink-300",
    challenges: [
      { cycle: "III", competency: C.aprecia, text: "¿Un dibujo tiene que parecerse a la realidad para ser bonito?" },
      { cycle: "III", competency: C.crea, text: "Si tuvieras que pintar la alegría, ¿qué colores usarías? ¿Por qué?" },
      { cycle: "IV", competency: C.aprecia, text: "¿Por qué los retablos ayacuchanos tienen tantos personajes?" },
      { cycle: "IV", competency: C.crea, text: "¿Podríamos hacer música solo con cosas recicladas? ¿Cómo?" },
      { cycle: "V", competency: C.aprecia, text: "¿Por qué hay marinera norteña, limeña y puneña? ¿Qué las hace distintas?" },
      { cycle: "V", competency: C.crea, text: "¿Un grafiti en una pared es arte o es ensuciar? ¿De qué depende?" },
    ],
  },
  {
    slug: "educacion-fisica",
    name: "Educación Física",
    icon: Activity,
    tint: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    challenges: [
      { cycle: "III", competency: C.motricidad, text: "¿Llego más lejos si muevo los brazos al saltar? ¿Cómo lo averiguo?" },
      { cycle: "III", competency: C.sociomotriz, text: "¿Qué es mejor: ganar o jugar limpio?" },
      { cycle: "IV", competency: C.saludable, text: "¿Por qué el corazón late más rápido cuando corremos?" },
      { cycle: "IV", competency: C.sociomotriz, text: "¿Es justo que en los juegos siempre elijan primero a los mismos?" },
      { cycle: "V", competency: C.saludable, text: "Una gaseosa dice que «da energía». ¿Es buena idea tomarla antes de jugar?" },
      { cycle: "V", competency: C.motricidad, text: "¿Por qué los deportistas calientan antes de correr?" },
    ],
  },
  {
    slug: "ingles",
    name: "Inglés",
    icon: Languages,
    tint: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300",
    challenges: [
      { cycle: "III", competency: C.oralIngles, text: "¿Por qué palabras como «animal» o «chocolate» se parecen en inglés y en castellano?" },
      { cycle: "III", competency: C.oralIngles, text: "Si alguien me habla en inglés y no entiendo todo, ¿qué me ayuda a saber qué quiere?" },
      { cycle: "IV", competency: C.leeIngles, text: "Si no entiendo una palabra en inglés, ¿qué pistas me ayudan a adivinarla?" },
      { cycle: "IV", competency: C.escribeIngles, text: "¿Por qué en inglés se dice «red car» y no «car red»?" },
      { cycle: "V", competency: C.oralIngles, text: "¿Por qué en inglés se dice «I am ten» y no «I have ten years»?" },
      { cycle: "V", competency: C.leeIngles, text: "¿Por qué usamos palabras del inglés como «gol» o «chat» en castellano?" },
    ],
  },
  {
    slug: "educacion-religiosa",
    name: "Educación Religiosa",
    icon: Heart,
    tint: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
    challenges: [
      { cycle: "III", competency: C.religionIdentidad, text: "¿Qué significa ser un buen amigo?" },
      { cycle: "III", competency: C.religionVida, text: "¿Por qué es importante dar las gracias?" },
      { cycle: "IV", competency: C.religionVida, text: "¿Está bien decir una mentira para no hacer sentir mal a alguien?" },
      { cycle: "IV", competency: C.religionIdentidad, text: "¿Cómo podemos cuidar la naturaleza como un regalo que recibimos?" },
      { cycle: "V", competency: C.religionVida, text: "¿Perdonar significa olvidar lo que pasó?" },
      { cycle: "V", competency: C.religionIdentidad, text: "En mi barrio hay personas de distintas religiones. ¿Cómo podemos respetarnos?" },
    ],
  },
  {
    slug: "competencias-transversales",
    name: "TIC y aprender a aprender",
    icon: MonitorSmartphone,
    tint: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
    challenges: [
      { cycle: "III", competency: C.tic, text: "Un video dice que los dinosaurios todavía existen. ¿Cómo lo averiguo?" },
      { cycle: "III", competency: C.autonomo, text: "¿Qué me ayuda más a recordar algo: leerlo o explicárselo a alguien?" },
      { cycle: "IV", competency: C.tic, text: "Un anuncio dice: «9 de cada 10 niños prefieren este cereal». ¿Le creo?" },
      { cycle: "IV", competency: C.autonomo, text: "¿Cómo sé si de verdad entendí una tarea y no solo la copié?" },
      { cycle: "V", competency: C.tic, text: "¿Una foto en redes sociales siempre muestra la verdad?" },
      { cycle: "V", competency: C.autonomo, text: "Cuando una tarea me sale mal, ¿la dejo o busco otra forma? ¿Por qué?" },
    ],
  },
];

/** Retos del área para el grado del niño; sin grado elegido, todos. */
export function challengesFor(area: Area, grade?: number): Challenge[] {
  const cycle = cycleOfGrade(grade);
  return cycle ? area.challenges.filter((c) => c.cycle === cycle) : area.challenges;
}

/** El reto del día cambia cada día y es el mismo para toda la clase (de su ciclo). */
export function dailyChallenge(date = new Date(), grade?: number): { area: Area; text: string } {
  const all = AREAS.flatMap((area) => challengesFor(area, grade).map(({ text }) => ({ area, text })));
  const day = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(2026, 0, 1)) /
      86_400_000,
  );
  return all[((day % all.length) + all.length) % all.length];
}

const GRADE_KEY = "tuku.grade";

/** Grado guardado por el niño al empezar un reto (localStorage puede no estar disponible). */
export function loadGrade(): number | undefined {
  try {
    const v = Number(localStorage.getItem(GRADE_KEY));
    return v >= 1 && v <= 6 ? v : undefined;
  } catch {
    return undefined;
  }
}

export function saveGrade(grade: number): void {
  try {
    localStorage.setItem(GRADE_KEY, String(grade));
  } catch {
    /* almacenamiento no disponible: el grado vale solo para esta visita */
  }
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
