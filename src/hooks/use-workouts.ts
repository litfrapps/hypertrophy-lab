// ============================================
// Hypertrophy Lab — Workout Storage Hook
// ============================================
// Uses localStorage until Supabase is configured

"use client";

import { useState, useEffect, useCallback } from "react";
import { WorkoutLog } from "@/types";

const STORAGE_KEY = "hypertrophy-lab-workouts";

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setWorkouts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load workouts:", e);
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
    }
  }, [workouts, isLoaded]);

  const addWorkout = useCallback((log: WorkoutLog) => {
    setWorkouts((prev) => [log, ...prev]);
  }, []);

  const addWorkouts = useCallback((newLogs: WorkoutLog[]) => {
    setWorkouts((prev) => [...newLogs, ...prev]);
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const updateWorkout = useCallback((id: string, updated: Partial<WorkoutLog>) => {
    setWorkouts((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updated } : w))
    );
  }, []);

  const getWorkoutsForExercise = useCallback(
    (exerciseId: string) => {
      return workouts
        .filter((w) => w.exerciseId === exerciseId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
    [workouts]
  );

  const getRecentWorkouts = useCallback(
    (limit: number = 10) => {
      return workouts
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    },
    [workouts]
  );

  const getProgressData = useCallback(
    (exerciseId: string) => {
      const exerciseWorkouts = getWorkoutsForExercise(exerciseId);
      return exerciseWorkouts.map((w) => {
        const maxWeight = Math.max(...w.sets.map((s) => s.weight));
        const totalVolume = w.sets.reduce(
          (sum, s) => sum + s.reps * s.weight,
          0
        );
        return {
          date: w.date,
          weight: maxWeight,
          volume: totalVolume,
          topSet: maxWeight,
        };
      });
    },
    [getWorkoutsForExercise]
  );

  return {
    workouts,
    isLoaded,
    addWorkout,
    addWorkouts,
    deleteWorkout,
    updateWorkout,
    getWorkoutsForExercise,
    getRecentWorkouts,
    getProgressData,
  };
}
