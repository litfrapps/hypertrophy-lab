// ============================================
// Hypertrophy Lab — Workout Storage Hook
// ============================================
// Dual-layer storage:
// 1. Primary: Supabase server API (synced across devices for authenticated Clerk users)
// 2. Fallback: Browser localStorage (instant offline-first storage when Supabase is unconfigured or network is unavailable)
// Seamlessly syncs unsynced local sessions to Supabase once connected.

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { WorkoutLog, WorkoutSession } from "@/types";

const STORAGE_KEY = "hypertrophy-lab-sessions";
const LEGACY_STORAGE_KEY = "hypertrophy-lab-workouts";

// ──────────────────────────────────────────
// LocalStorage Persistence Helpers
// ──────────────────────────────────────────
function loadLocalSessions(): WorkoutSession[] {
  if (typeof window === "undefined") return [];

  try {
    const rawSessions = localStorage.getItem(STORAGE_KEY);
    if (rawSessions) {
      const parsed = JSON.parse(rawSessions);
      if (Array.isArray(parsed)) return parsed;
    }

    // Backward-compatibility: Check legacy flat logs format
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyLogs: WorkoutLog[] = JSON.parse(legacyRaw);
      if (Array.isArray(legacyLogs) && legacyLogs.length > 0) {
        const sessionMap = new Map<string, WorkoutLog[]>();
        for (const log of legacyLogs) {
          const key = log.sessionId || log.date.slice(0, 10);
          if (!sessionMap.has(key)) sessionMap.set(key, []);
          sessionMap.get(key)!.push(log);
        }
        const convertedSessions: WorkoutSession[] = Array.from(sessionMap.entries()).map(([key, groupLogs]) => ({
          id: groupLogs[0]?.sessionId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : key),
          date: groupLogs[0]?.date || new Date().toISOString(),
          logs: groupLogs,
        }));
        saveLocalSessions(convertedSessions);
        return convertedSessions;
      }
    }
  } catch (err) {
    console.warn("[useWorkouts] Failed to read from localStorage:", err);
  }

  return [];
}

function saveLocalSessions(sessions: WorkoutSession[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn("[useWorkouts] Failed to write to localStorage:", err);
  }
}

export function useWorkouts() {
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // ──────────────────────────────────────────
  // 1. Initial Load: Immediate local hydration
  // ──────────────────────────────────────────
  useEffect(() => {
    const cached = loadLocalSessions();
    if (cached.length > 0) {
      setSessions(cached);
    }
  }, []);

  // ──────────────────────────────────────────
  // 2. Sync with Supabase (if signed in and online)
  // ──────────────────────────────────────────
  useEffect(() => {
    if (!clerkLoaded) return;

    // If not signed in, operate locally from localStorage
    if (!isSignedIn) {
      const cached = loadLocalSessions();
      setSessions(cached);
      setIsLoaded(true);
      return;
    }

    let isMounted = true;

    async function syncSessions() {
      try {
        const res = await fetch("/api/sessions");

        if (res.status === 503) {
          // Supabase is unconfigured — gracefully operate in offline localStorage mode
          if (isMounted) {
            setIsOffline(true);
            const cached = loadLocalSessions();
            if (cached.length > 0) setSessions(cached);
          }
          return;
        }

        if (res.status === 401) {
          return;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const remoteSessions: WorkoutSession[] = await res.json();
        if (Array.isArray(remoteSessions) && isMounted) {
          setIsOffline(false);

          setSessions((currentSessions) => {
            const local = currentSessions.length > 0 ? currentSessions : loadLocalSessions();
            const remoteIds = new Set(remoteSessions.map((s) => s.id));
            const unsynced = local.filter((s) => !remoteIds.has(s.id));

            // Background sync: Upload local sessions that don't exist on server yet
            if (unsynced.length > 0) {
              unsynced.forEach((s) => {
                fetch("/api/sessions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(s),
                }).catch((err) => {
                  console.warn("[useWorkouts] Background sync error for session:", s.id, err);
                });
              });
            }

            const merged = [...unsynced, ...remoteSessions];
            saveLocalSessions(merged);
            return merged;
          });
        }
      } catch (err) {
        // Network offline or fetch error — keep localStorage
        console.warn("[useWorkouts] Supabase/API unavailable, running in offline localStorage mode:", err);
        if (isMounted) {
          setIsOffline(true);
          const cached = loadLocalSessions();
          if (cached.length > 0) setSessions(cached);
        }
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    }

    syncSessions();

    return () => {
      isMounted = false;
    };
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
    // 1. Always save to local state and localStorage immediately
    setSessions((prev) => {
      const updated = [newSession, ...prev.filter((s) => s.id !== newSession.id)];
      saveLocalSessions(updated);
      return updated;
    });
    setIsSaving(true);

    // 2. Try to sync to Supabase
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });

      if (res.status === 503) {
        // Supabase unconfigured: safe fallback, keep in localStorage
        setIsOffline(true);
        console.info("[useWorkouts] Supabase not configured. Workout safely preserved in localStorage.");
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      setIsOffline(false);
    } catch (err) {
      // Offline / network failure: keep the session safely in localStorage
      setIsOffline(true);
      console.warn("[useWorkouts] Network or server unavailable. Workout preserved in localStorage:", err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // ──────────────────────────────────────────
  // Delete an entire session (+ all its logs)
  // ──────────────────────────────────────────
  const deleteSession = useCallback(async (sessionId: string) => {
    // 1. Remove from state and localStorage immediately
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId);
      saveLocalSessions(updated);
      return updated;
    });

    // 2. Try to sync deletion to server
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (res.status === 503) return; // unconfigured
      if (!res.ok && res.status !== 404) {
        console.warn(`[useWorkouts] Server deleteSession returned HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn("[useWorkouts] Could not sync deleteSession to server (offline):", err);
    }
  }, []);

  // ──────────────────────────────────────────
  // Update date/time for a session
  // ──────────────────────────────────────────
  const updateSessionDateTime = useCallback(
    async (sessionId: string, newDateISO: string) => {
      // 1. Update state and localStorage immediately
      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                date: newDateISO,
                logs: s.logs.map((l) => ({ ...l, date: newDateISO })),
              }
            : s
        );
        saveLocalSessions(updated);
        return updated;
      });

      // 2. Try to sync update to server
      try {
        const res = await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: newDateISO }),
        });
        if (res.status === 503) return;
        if (!res.ok) {
          console.warn(`[useWorkouts] Server updateSessionDateTime returned HTTP ${res.status}`);
        }
      } catch (err) {
        console.warn("[useWorkouts] Could not sync updateSessionDateTime to server (offline):", err);
      }
    },
    []
  );

  // ──────────────────────────────────────────
  // Delete individual workout log (used by Progress page)
  // ──────────────────────────────────────────
  const deleteWorkout = useCallback(async (logId: string) => {
    // 1. Remove log from state and localStorage immediately
    setSessions((prev) => {
      const updated = prev
        .map((s) => ({
          ...s,
          logs: s.logs.filter((l) => l.id !== logId),
        }))
        .filter((s) => s.logs.length > 0);
      saveLocalSessions(updated);
      return updated;
    });

    // 2. Try to sync to server
    try {
      const res = await fetch(`/api/logs/${logId}`, { method: "DELETE" });
      if (res.status === 503) return;
      if (!res.ok && res.status !== 404) {
        console.warn(`[useWorkouts] Server deleteWorkout returned HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn("[useWorkouts] Could not sync deleteWorkout to server (offline):", err);
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

  // Returns the most recent sets logged for an exercise (weight + reps per set)
  const getLastEntryForExercise = useCallback(
    (exerciseId: string): { weight: number; reps: number }[] | null => {
      const entries = workouts
        .filter((w) => w.exerciseId === exerciseId)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      if (entries.length === 0) return null;
      return entries[0].sets.map((s) => ({ weight: s.weight, reps: s.reps }));
    },
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

  // Legacy stubs for backwards compatibility
  const addWorkout = useCallback((log: WorkoutLog) => {
    setSessions((prev) => {
      const sessionId = log.sessionId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}`);
      const logWithSession = { ...log, sessionId };
      const existingSessionIndex = prev.findIndex((s) => s.id === sessionId);
      let updated: WorkoutSession[];
      if (existingSessionIndex >= 0) {
        updated = prev.map((s, idx) =>
          idx === existingSessionIndex
            ? { ...s, logs: [logWithSession, ...s.logs] }
            : s
        );
      } else {
        const newSession: WorkoutSession = {
          id: sessionId,
          date: log.date,
          logs: [logWithSession],
        };
        updated = [newSession, ...prev];
      }
      saveLocalSessions(updated);
      return updated;
    });
  }, []);

  return {
    workouts,
    sessions: sortedSessions,
    isLoaded,
    isSaving,
    isOffline,
    // Write operations
    addSession,
    deleteSession,
    updateSessionDateTime,
    deleteWorkout,
    // Read helpers
    getWorkoutsForExercise,
    getRecentWorkouts,
    getLastEntryForExercise,
    getProgressData,
    // Legacy stubs
    addWorkout,
    addWorkouts: async (logs: WorkoutLog[]) => {
      logs.forEach(addWorkout);
    },
    updateWorkout: async (id: string, updated: Partial<WorkoutLog>) => {
      setSessions((prev) => {
        const newSessions = prev.map((s) => ({
          ...s,
          logs: s.logs.map((l) => (l.id === id ? { ...l, ...updated } : l)),
        }));
        saveLocalSessions(newSessions);
        return newSessions;
      });
    },
  };
}
