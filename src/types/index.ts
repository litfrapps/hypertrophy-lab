// ============================================
// Hypertrophy Lab — Type Definitions
// ============================================

// --- Muscle Groups ---
export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Quads"
  | "Hamstrings"
  | "Glutes"
  | "Calves"
  | "Core"
  | "Forearms"
  | "Traps";

// --- Exercise ---
export interface Exercise {
  id: string;
  name: string;
  image: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscle: MuscleGroup;
  equipment: string;
  instructions?: string[];
}

// --- Workout Logging ---
export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weight: number;
  unit?: "kg" | "lbs";
}

export interface WorkoutLog {
  id: string;
  sessionId?: string; // Group logs belonging to the same workout session
  date: string; // ISO date string
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  unit: "kg" | "lbs";
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO date string
  durationSeconds?: number;
  logs: WorkoutLog[];
  notes?: string;
}

// --- Progress ---
export interface ProgressDataPoint {
  date: string;
  weight: number;
  volume: number; // sets × reps × weight
  topSet: number; // heaviest set
}

// --- Research Papers ---
export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  doi: string;
  url: string;
  abstract: string;
  category: PaperCategory;
  keyFindings: string[];
}

export type PaperCategory =
  | "Volume"
  | "Frequency"
  | "Intensity"
  | "Rest Periods"
  | "Exercise Selection"
  | "Periodization"
  | "Muscle Growth"
  | "Training to Failure"
  | "Rep Ranges"
  | "Nutrition";

// --- AI Chat ---
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  timestamp: string;
}

export interface ChatSource {
  title: string;
  url: string;
  snippet: string;
}

// --- Rest Timer ---
export interface TimerPreset {
  label: string;
  seconds: number;
}

// --- User Preferences ---
export interface UserPreferences {
  unit: "kg" | "lbs";
  defaultRestTimer: number; // in seconds
  timerPresets: TimerPreset[];
}
