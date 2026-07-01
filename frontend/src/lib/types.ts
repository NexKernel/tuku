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
  | "detect_topic"
  | "detect_subtopic"
  | "detect_difficulty"
  | "detect_competencies"
  | "extract_data"
  | "explain_strategy"
  | "socratic_questions"
  | "await_response"
  | "feedback"
  | "solve"
  | "short_method"
  | "elimination_method"
  | "common_error"
  | "similar_exercise"
  | "register_performance";

export type MessageRole = "user" | "tutor" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  step: TutorStep | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  detected_subject: string | null;
  detected_topic: string | null;
  detected_difficulty: string | null;
  current_step: TutorStep;
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
