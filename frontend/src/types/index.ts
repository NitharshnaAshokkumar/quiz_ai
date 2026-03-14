// -----------------------------------------------
// API Types — mirrors Django backend serializers
// -----------------------------------------------

export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  order: number;
  // Only present in review mode
  correct_option?: string;
  explanation?: string;
}

export interface Quiz {
  id: number;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  num_questions: number;
  created_at: string;
  questions: Question[];
  question_count: number;
}

export interface Attempt {
  id: number;
  quiz: number;
  quiz_topic: string;
  quiz_difficulty: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken: number;
  started_at: string;
  completed_at: string | null;
  is_completed: boolean;
}

export interface AttemptDetail extends Attempt {
  answers: UserAnswer[];
}

export interface UserAnswer {
  id: number;
  question: number;
  selected_option: string;
  is_correct: boolean;
}

export interface QuizCreatePayload {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  num_questions: number;
}

export interface SubmitAnswerPayload {
  question_id: number;
  selected_option: string;
}

export interface SubmitAttemptPayload {
  answers: SubmitAnswerPayload[];
  time_taken: number;
}
