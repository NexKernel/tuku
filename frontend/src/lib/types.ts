export type UserRole = "student" | "teacher" | "admin" | "superadmin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type TutorStep =
  | "curiosity"
  | "understand"
  | "hypothesis"
  | "reasoning"
  | "evidence"
  | "perspectives"
  | "conclusion"
  | "metacognition"
  | "transfer"
  // Camino "problema" (matemática)
  | "estimate"
  | "plan"
  | "solve"
  | "check";

export type ThinkingPath = "quick" | "full" | "problem";

export type MessageRole = "user" | "tutor" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  step: TutorStep | null;
  /** Seguridad que marcó el niño (1 poco, 2 más o menos, 3 muy seguro). */
  confidence?: number | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  detected_subject: string | null;
  detected_topic: string | null;
  detected_difficulty: string | null;
  current_step: TutorStep;
  grade: number | null;
  /** "quick" = rápido (6 pasos), "full" = explorador (9), "problem" = problema con números (7). */
  path: ThinkingPath;
  is_favorite: boolean;
  created_at: string;
}

export interface ConversationDetail extends Conversation {
  problem_statement: string | null;
  messages: Message[];
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  conversation_id: string;
  conversation_title: string;
  /** 1 recordar · 2 aplicar · 3 enseñar */
  round: number;
  due_at: string;
  question: string | null;
  answer: string | null;
  feedback: string | null;
  completed_at: string | null;
}

export interface ReviewOverview {
  due: Review[];
  completed: number;
}
