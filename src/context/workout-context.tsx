"use client";

/**
 * WorkoutContext — Lifted session exercise state
 *
 * Separates workout-session business logic from the log page UI.
 * Consumes SessionContext (timer / date / unit) and provides:
 *   - sessionExercises (the array of items currently being tracked)
 *   - All mutators: add, remove, update sets, toggle complete, etc.
 *   - Derived live stats: liveVolume, totalPlannedSets, totalCompletedSets
 *
 * This context is intentionally kept display-agnostic — it owns data,
 * not JSX. Every component that needs session data reads from here.
 */

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useSession } from "@/contexts/session-context";
import type {
  SessionExerciseSet,
  SessionExerciseItem,
} from "@/contexts/session-context";
import { useWorkouts } from "@/hooks/use-workouts";
import { Exercise } from "@/types";

// Re-export session-context types so consumers can import from a single place
export type { SessionExerciseSet, SessionExerciseItem };

// ── Context shape ──────────────────────────────────────────────────────────────

interface WorkoutContextValue {
  sessionExercises: SessionExerciseItem[];

  // Live derived stats
  liveVolume: number;
  totalPlannedSets: number;
  totalCompletedSets: number;

  // Set mutators
  addSetToExercise: (itemId: string) => void;
  removeSetFromExercise: (itemId: string, setIndex: number) => void;
  updateSetValues: (
    itemId: string,
    setIndex: number,
    field: "weight" | "reps",
    value: number
  ) => void;
  toggleSetComplete: (
    itemId: string,
    setIndex: number,
    onInvalidSet: () => void
  ) => void;

  // Exercise mutators
  addExerciseToSession: (
    exercise: Exercise,
    onMuscleGroupMismatch: (exercise: Exercise) => void
  ) => void;
  commitAddExerciseToSession: (exercise: Exercise) => void;
  removeExerciseFromSession: (itemId: string) => void;
  updateExerciseRestTimer: (itemId: string, seconds: number) => void;
  startRestForExercise: (itemId: string) => void;
  dismissExerciseTimer: (itemId: string) => void;

  // Build initial sets from last entry history
  buildInitialSets: (exercise: Exercise) => SessionExerciseSet[];
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const { globalUnit, convertWeight, getLastEntryForExercise } = useWorkouts();
  const { exercises: sessionExercises, setExercises: setSessionExercises } =
    useSession();

  // ── Derived stats (memoised to prevent dropped frames on mobile) ────────────

  const liveVolume = useMemo(
    () =>
      sessionExercises.reduce(
        (sum, e) =>
          sum +
          e.sets
            .filter((s) => s.completed)
            .reduce((sSum, s) => sSum + s.reps * s.weight, 0),
        0
      ),
    [sessionExercises]
  );

  const totalPlannedSets = useMemo(
    () => sessionExercises.reduce((sum, e) => sum + e.sets.length, 0),
    [sessionExercises]
  );

  const totalCompletedSets = useMemo(
    () =>
      sessionExercises.reduce(
        (sum, e) => sum + e.sets.filter((s) => s.completed).length,
        0
      ),
    [sessionExercises]
  );

  // ── Build initial sets using last-entry history ────────────────────────────

  const buildInitialSets = useCallback(
    (exercise: Exercise): SessionExerciseSet[] => {
      const last = getLastEntryForExercise(exercise.id);
      if (last && last.length > 0) {
        return last.map((s, idx) => ({
          setNumber: idx + 1,
          reps: s.reps,
          weight: convertWeight(s.weight, s.unit || "kg", globalUnit),
          unit: globalUnit,
          completed: false,
        }));
      }
      return [
        { setNumber: 1, reps: 0, weight: 0, unit: globalUnit, completed: false },
        { setNumber: 2, reps: 0, weight: 0, unit: globalUnit, completed: false },
        { setNumber: 3, reps: 0, weight: 0, unit: globalUnit, completed: false },
      ];
    },
    [getLastEntryForExercise, convertWeight, globalUnit]
  );

  // ── Set mutators ───────────────────────────────────────────────────────────

  const addSetToExercise = useCallback(
    (itemId: string) => {
      setSessionExercises((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const lastSet = item.sets[item.sets.length - 1];
          const newSet: SessionExerciseSet = {
            setNumber: item.sets.length + 1,
            reps: lastSet ? lastSet.reps : 0,
            weight: lastSet ? lastSet.weight : 0,
            unit: globalUnit,
            completed: false,
          };
          return { ...item, sets: [...item.sets, newSet] };
        })
      );
    },
    [setSessionExercises, globalUnit]
  );

  const removeSetFromExercise = useCallback(
    (itemId: string, setIndex: number) => {
      setSessionExercises((prev) =>
        prev.map((item) => {
          if (item.id !== itemId || item.sets.length <= 1) return item;
          const updatedSets = item.sets
            .filter((_, idx) => idx !== setIndex)
            .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
          return { ...item, sets: updatedSets };
        })
      );
    },
    [setSessionExercises]
  );

  const updateSetValues = useCallback(
    (itemId: string, setIndex: number, field: "weight" | "reps", value: number) => {
      setSessionExercises((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const updatedSets = item.sets.map((s, idx) =>
            idx === setIndex ? { ...s, [field]: value } : s
          );
          return { ...item, sets: updatedSets };
        })
      );
    },
    [setSessionExercises]
  );

  const toggleSetComplete = useCallback(
    (itemId: string, setIndex: number, onInvalidSet: () => void) => {
      const item = sessionExercises.find((ex) => ex.id === itemId);
      if (!item) return;
      const targetSet = item.sets[setIndex];
      if (!targetSet) return;

      if (!targetSet.completed) {
        const weight = Number(targetSet.weight);
        const reps = Number(targetSet.reps);
        if (isNaN(weight) || weight <= 0 || isNaN(reps) || reps <= 0) {
          onInvalidSet();
          return;
        }
      }

      setSessionExercises((prev) =>
        prev.map((it) => {
          if (it.id !== itemId) return it;
          const updatedSets = it.sets.map((s, idx) => {
            if (idx !== setIndex) return s;
            return { ...s, completed: !s.completed };
          });
          const justCompleted = !it.sets[setIndex].completed;
          return {
            ...it,
            sets: updatedSets,
            timerActive: justCompleted ? true : it.timerActive,
            timerKey: justCompleted ? it.timerKey + 1 : it.timerKey,
          };
        })
      );
    },
    [sessionExercises, setSessionExercises]
  );

  // ── Exercise mutators ──────────────────────────────────────────────────────

  const commitAddExerciseToSession = useCallback(
    (exercise: Exercise) => {
      const newItem: SessionExerciseItem = {
        id: crypto.randomUUID(),
        exercise,
        restTimerSeconds: 120,
        timerActive: false,
        timerKey: 0,
        sets: buildInitialSets(exercise),
      };
      setSessionExercises((prev) => [...prev, newItem]);
    },
    [setSessionExercises, buildInitialSets]
  );

  const addExerciseToSession = useCallback(
    (exercise: Exercise, onMuscleGroupMismatch: (exercise: Exercise) => void) => {
      if (sessionExercises.length > 0) {
        const existingMuscle = sessionExercises[0].exercise.primaryMuscle;
        if (exercise.primaryMuscle !== existingMuscle) {
          onMuscleGroupMismatch(exercise);
          return;
        }
      }
      commitAddExerciseToSession(exercise);
    },
    [sessionExercises, commitAddExerciseToSession]
  );

  const removeExerciseFromSession = useCallback(
    (itemId: string) => {
      setSessionExercises((prev) => prev.filter((item) => item.id !== itemId));
    },
    [setSessionExercises]
  );

  const updateExerciseRestTimer = useCallback(
    (itemId: string, seconds: number) => {
      setSessionExercises((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, restTimerSeconds: seconds } : item
        )
      );
    },
    [setSessionExercises]
  );

  const startRestForExercise = useCallback(
    (itemId: string) => {
      setSessionExercises((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, timerActive: true, timerKey: item.timerKey + 1 }
            : item
        )
      );
    },
    [setSessionExercises]
  );

  const dismissExerciseTimer = useCallback(
    (itemId: string) => {
      setSessionExercises((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, timerActive: false } : item
        )
      );
    },
    [setSessionExercises]
  );

  const value = useMemo<WorkoutContextValue>(
    () => ({
      sessionExercises,
      liveVolume,
      totalPlannedSets,
      totalCompletedSets,
      addSetToExercise,
      removeSetFromExercise,
      updateSetValues,
      toggleSetComplete,
      addExerciseToSession,
      commitAddExerciseToSession,
      removeExerciseFromSession,
      updateExerciseRestTimer,
      startRestForExercise,
      dismissExerciseTimer,
      buildInitialSets,
    }),
    [
      sessionExercises,
      liveVolume,
      totalPlannedSets,
      totalCompletedSets,
      addSetToExercise,
      removeSetFromExercise,
      updateSetValues,
      toggleSetComplete,
      addExerciseToSession,
      commitAddExerciseToSession,
      removeExerciseFromSession,
      updateExerciseRestTimer,
      startRestForExercise,
      dismissExerciseTimer,
      buildInitialSets,
    ]
  );

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useWorkoutContext(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) {
    throw new Error("useWorkoutContext must be used within a <WorkoutProvider>");
  }
  return ctx;
}
