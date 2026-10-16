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
  id?: string;
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

// --- Custom Routines ---
export interface SavedRoutine {
  id: string;
  name: string;
  exerciseIds: string[];
}

