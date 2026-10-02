// ============================================
// Hypertrophy Lab — Workout Storage Hook (Supabase-backed)
// ============================================
// Fetches and mutates workout data via /api/sessions and /api/logs routes.
// Data is scoped to the authenticated Clerk user via server-side RLS.

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { WorkoutLog, WorkoutSession } from "@/types";

export function useWorkouts() {
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ──────────────────────────────────────────
  // Load sessions from the API on mount
  // ──────────────────────────────────────────
  useEffect(() => {
    if (!clerkLoaded) return;
    if (!isSignedIn) {
      setSessions([]);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    fetch("/api/sessions")
      .then(async (res) => {
        if (res.status === 503 || res.status === 401) {
          // Supabase not yet configured or session transition — return empty data silently
          return [];
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: WorkoutSession[]) => {
        setSessions(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("[useWorkouts] Failed to load sessions:", err);
      })
      .finally(() => setIsLoaded(true));
  }, [clerkLoaded, isSignedIn]);

  // ──────────────────────────────────────────
  // Derived: flat list of all workout logs
  // ──────────────────────────────────────────
  const workouts = useMemo<WorkoutLog[]>(() => {
    return sessions.flatMap((s) => s.logs);
  }, [sessions]);

  // ──────────────────────────────────────────
  // Add a complete workout session
  // ──────────────────────────────────────────
  const addSession = useCallback(async (newSession: WorkoutSession) => {
    // Optimistic update
    setSessions((prev) => [newSession, ...prev]);
    setIsSaving(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
    } catch (err) {
      console.error("[useWorkouts] addSession failed:", err);
      // Rollback optimistic update
      setSessions((prev) => prev.filter((s) => s.id !== newSession.id));
    } finally {
      setIsSaving(false);
    }
  }, []);

  // ──────────────────────────────────────────
  // Delete an entire session (+ all its logs)
  // ──────────────────────────────────────────
  const deleteSession = useCallback(async (sessionId: string) => {
    // Optimistic removal
    const prev = sessions;
    setSessions((s) => s.filter((x) => x.id !== sessionId));

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
    } catch (err) {
      console.error("[useWorkouts] deleteSession failed:", err);
      setSessions(prev); // Rollback
    }
  }, [sessions]);

  // ──────────────────────────────────────────
  // Update date/time for a session
  // ──────────────────────────────────────────
  const updateSessionDateTime = useCallback(
    async (sessionId: string, newDateISO: string) => {
      // Optimistic update
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                date: newDateISO,
                logs: s.logs.map((l) => ({ ...l, date: newDateISO })),
              }
            : s
        )
      );

      try {
        const res = await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: newDateISO }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
      } catch (err) {
        console.error("[useWorkouts] updateSessionDateTime failed:", err);
        // Re-fetch to restore server truth
        fetch("/api/sessions")
          .then((r) => r.json())
          .then(setSessions)
          .catch(console.error);
      }
    },
    []
  );

  // ──────────────────────────────────────────
  // Delete individual workout log (used by Progress page)
  // ──────────────────────────────────────────
  const deleteWorkout = useCallback(async (logId: string) => {
    // Optimistic removal
    setSessions((prev) =>
      prev
        .map((s) => ({
          ...s,
          logs: s.logs.filter((l) => l.id !== logId),
        }))
        .filter((s) => s.logs.length > 0)
    );

    try {
      const res = await fetch(`/api/logs/${logId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
    } catch (err) {
      console.error("[useWorkouts] deleteWorkout failed:", err);
      // Re-fetch to restore server truth
      fetch("/api/sessions")
        .then((r) => r.json())
        .then(setSessions)
        .catch(console.error);
    }
  }, []);

  // ──────────────────────────────────────────
  // Read helpers (derived from in-memory state)
  // ──────────────────────────────────────────
  const getWorkoutsForExercise = useCallback(
    (exerciseId: string) =>
      workouts
        .filter((w) => w.exerciseId === exerciseId)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
    [workouts]
  );

  const getRecentWorkouts = useCallback(
    (limit = 10) =>
      [...workouts]
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .slice(0, limit),
    [workouts]
  );

  const getProgressData = useCallback(
    (exerciseId: string) => {
      return getWorkoutsForExercise(exerciseId).map((w) => {
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

  // Sorted sessions (newest first)
  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [sessions]
  );

  return {
    workouts,
    sessions: sortedSessions,
    isLoaded,
    isSaving,
    // Write operations
    addSession,
    deleteSession,
    updateSessionDateTime,
    deleteWorkout,
    // Read helpers
    getWorkoutsForExercise,
    getRecentWorkouts,
    getProgressData,
    // Legacy stubs (unused pages may reference these)
    addWorkout: async (_log: WorkoutLog) => {},
    addWorkouts: async (_logs: WorkoutLog[]) => {},
    updateWorkout: async (_id: string, _updated: Partial<WorkoutLog>) => {},
  };
}
