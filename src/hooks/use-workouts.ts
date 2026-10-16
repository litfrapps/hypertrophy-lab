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
import { WorkoutLog, WorkoutSession, SavedRoutine } from "@/types";

export type { SavedRoutine };

// ──────────────────────────────────────────
// E1RM Utility — Epley Formula
// E1RM = Weight × (1 + Reps / 30)
// ──────────────────────────────────────────
import {
  useUnit,
  convertWeight,
  formatWeight,
  UNIT_STORAGE_KEY,
  KG_TO_LBS,
  LBS_TO_KG,
  type WeightUnit,
} from "@/contexts/unit-context";

export {
  useUnit,
  convertWeight,
  formatWeight,
  UNIT_STORAGE_KEY,
  KG_TO_LBS,
  LBS_TO_KG,
  type WeightUnit,
};

import { calculateE1RM } from "@/lib/calculations";
export { calculateE1RM };

export function getLogE1RM(log: WorkoutLog): number {
  if (!log.sets || log.sets.length === 0) return 0;
  const topSet = log.sets.reduce((best, s) =>
    s.weight > best.weight ? s : best
  , log.sets[0]);
  return calculateE1RM(topSet.weight, topSet.reps);
}

const BASE_STORAGE_KEY = "hypertrophy-lab-sessions";
const LEGACY_STORAGE_KEY = "hypertrophy-lab-workouts";
export const ROUTINES_STORAGE_KEY = "muscle_lab_custom_routines";
const LEGACY_ROUTINES_KEY = "hypertrophy_custom_routines";

const getStorageKey = (userId?: string | null) =>
  userId ? `${BASE_STORAGE_KEY}-${userId}` : `${BASE_STORAGE_KEY}-guest`;
const getRoutinesKey = (userId?: string | null) =>
  userId ? `${ROUTINES_STORAGE_KEY}-${userId}` : `${ROUTINES_STORAGE_KEY}-guest`;
const getDeletedKey = (userId?: string | null) =>
  userId ? `hypertrophy-lab-deleted-${userId}` : "hypertrophy-lab-deleted-guest";

// ──────────────────────────────────────────
// Offline Deletion Tracking Helpers
// ──────────────────────────────────────────
export function loadDeletedSessionIds(userId?: string | null): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(getDeletedKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set();
}

export function markSessionDeleted(sessionId: string, userId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const set = loadDeletedSessionIds(userId);
    set.add(sessionId);
    localStorage.setItem(getDeletedKey(userId), JSON.stringify(Array.from(set)));
  } catch {}
}

export function unmarkSessionDeleted(sessionId: string, userId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const set = loadDeletedSessionIds(userId);
    set.delete(sessionId);
    localStorage.setItem(getDeletedKey(userId), JSON.stringify(Array.from(set)));
  } catch {}
}

// ──────────────────────────────────────────
// Routine LocalStorage Persistence Helpers
// ──────────────────────────────────────────
export function loadLocalRoutines(userId?: string | null): SavedRoutine[] {
  if (typeof window === "undefined") return [];
  const key = getRoutinesKey(userId);

  try {
    let raw = localStorage.getItem(key);
    // Backward-compatibility: migrate un-scoped routines
    if (!raw) {
      const legacy = localStorage.getItem(ROUTINES_STORAGE_KEY) || localStorage.getItem(LEGACY_ROUTINES_KEY);
      if (legacy) {
        localStorage.setItem(key, legacy);
        raw = legacy;
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("[useWorkouts] Failed to read routines from localStorage:", err);
  }

  return [];
}

export function saveLocalRoutines(routines: SavedRoutine[], userId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getRoutinesKey(userId), JSON.stringify(routines));
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("hypertrophy-routines-updated", { detail: { routines, userId } })
      );
    }, 0);
  } catch (err) {
    console.warn("[useWorkouts] Failed to write routines to localStorage:", err);
  }
}

// ──────────────────────────────────────────
// Session LocalStorage Persistence Helpers
// ──────────────────────────────────────────
export function loadLocalSessions(userId?: string | null): WorkoutSession[] {
  if (typeof window === "undefined") return [];
  const key = getStorageKey(userId);

  try {
    let rawSessions = localStorage.getItem(key);
    // Backward-compatibility: migrate un-scoped sessions once
    if (!rawSessions) {
      const legacy = localStorage.getItem(BASE_STORAGE_KEY);
      if (legacy) {
        localStorage.setItem(key, legacy);
        rawSessions = legacy;
      }
    }

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
          const k = log.sessionId || log.date.slice(0, 10);
          if (!sessionMap.has(k)) sessionMap.set(k, []);
          sessionMap.get(k)!.push(log);
        }
        const convertedSessions: WorkoutSession[] = Array.from(sessionMap.entries()).map(([k, groupLogs]) => ({
          id: groupLogs[0]?.sessionId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : k),
          date: groupLogs[0]?.date || new Date().toISOString(),
          logs: groupLogs,
        }));
        saveLocalSessions(convertedSessions, userId);
        try {
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {}
        return convertedSessions;
      }
    }
  } catch (err) {
    console.warn("[useWorkouts] Failed to read from localStorage:", err);
  }

  return [];
}

export function saveLocalSessions(sessions: WorkoutSession[], userId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(sessions));
    // Asynchronously dispatch outside of current React render cycle
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("hypertrophy-sessions-updated", { detail: { sessions, userId } })
      );
    }, 0);
  } catch (err) {
    console.warn("[useWorkouts] Failed to write to localStorage:", err);
  }
}

export function useWorkouts() {
  const { isLoaded: clerkLoaded, isSignedIn, userId } = useAuth();
  const {
    globalUnit,
    setGlobalUnit,
    toggleGlobalUnit,
    convertWeight: unitConvertWeight,
    formatWeight: unitFormatWeight,
  } = useUnit();

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // ──────────────────────────────────────────
  // 1. Initial Load: Immediate local hydration scoped to active user
  // ──────────────────────────────────────────
  // localStorage is an external system; reading it on userId change is the
  // canonical use-case the effect rule explicitly permits.
  useEffect(() => {
    const cachedSessions = loadLocalSessions(userId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(cachedSessions);

    const cachedRoutines = loadLocalRoutines(userId);
    setSavedRoutines(cachedRoutines);
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<
        { sessions: WorkoutSession[]; userId?: string | null } | WorkoutSession[]
      >;
      if (customEvent.detail) {
        if (Array.isArray(customEvent.detail)) {
          setSessions(customEvent.detail);
        } else if (
          customEvent.detail.sessions &&
          (!customEvent.detail.userId || customEvent.detail.userId === userId)
        ) {
          setSessions(customEvent.detail.sessions);
        }
      } else {
        const cached = loadLocalSessions(userId);
        if (cached.length > 0) setSessions(cached);
      }
    };

    const handleRoutineSync = (e: Event) => {
      const customEvent = e as CustomEvent<
        { routines: SavedRoutine[]; userId?: string | null } | SavedRoutine[]
      >;
      if (customEvent.detail) {
        if (Array.isArray(customEvent.detail)) {
          setSavedRoutines(customEvent.detail);
        } else if (
          customEvent.detail.routines &&
          (!customEvent.detail.userId || customEvent.detail.userId === userId)
        ) {
          setSavedRoutines(customEvent.detail.routines);
        }
      } else {
        const cached = loadLocalRoutines(userId);
        if (cached.length > 0) setSavedRoutines(cached);
      }
    };

    window.addEventListener("hypertrophy-sessions-updated", handleSync);
    window.addEventListener("hypertrophy-routines-updated", handleRoutineSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("storage", handleRoutineSync);
    return () => {
      window.removeEventListener("hypertrophy-sessions-updated", handleSync);
      window.removeEventListener("hypertrophy-routines-updated", handleRoutineSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("storage", handleRoutineSync);
    };
  }, [userId]);

  // ──────────────────────────────────────────
  // 2. Sync with Supabase (if signed in and online)
  // ──────────────────────────────────────────
  useEffect(() => {
    if (!clerkLoaded) return;

    // If not signed in, operate locally from user/guest localStorage
    if (!isSignedIn) {
      const cached = loadLocalSessions(userId);
      setTimeout(() => {
        setSessions(cached);
        setIsLoaded(true);
      }, 0);
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
            const cached = loadLocalSessions(userId);
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

          const deletedIds = loadDeletedSessionIds(userId);
          const validRemote = remoteSessions.filter((s) => !deletedIds.has(s.id));

          // Retry any pending server deletions that occurred while offline
          if (deletedIds.size > 0) {
            deletedIds.forEach((delId) => {
              fetch(`/api/sessions/${delId}`, { method: "DELETE" })
                .then((r) => {
                  if (r.ok || r.status === 404) unmarkSessionDeleted(delId, userId);
                })
                .catch(() => {});
            });
          }

          const local = loadLocalSessions(userId);
          const remoteIds = new Set(validRemote.map((s) => s.id));
          const unsynced = local.filter((s) => !remoteIds.has(s.id) && !deletedIds.has(s.id));

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

          const merged = [...unsynced, ...validRemote];
          saveLocalSessions(merged, userId);
          setSessions(merged);
        }
      } catch (err) {
        // Network offline or fetch error — keep localStorage
        console.warn("[useWorkouts] Supabase/API unavailable, running in offline localStorage mode:", err);
        if (isMounted) {
          setIsOffline(true);
          const cached = loadLocalSessions(userId);
          if (cached.length > 0) setSessions(cached);
        }
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    }

    syncSessions();

    // ──────────────────────────────────────────
    // 2b. Sync Routines with Server API
    // ──────────────────────────────────────────
    async function syncRoutines() {
      try {
        const res = await fetch("/api/routines");
        if (!res.ok) return;

        const remoteRoutines: SavedRoutine[] = await res.json();
        if (Array.isArray(remoteRoutines) && isMounted) {
          const local = loadLocalRoutines(userId);
          const remoteIds = new Set(remoteRoutines.map((r) => r.id));
          const unsynced = local.filter((r) => !remoteIds.has(r.id));

          if (unsynced.length > 0) {
            unsynced.forEach((u) => {
              fetch("/api/routines", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: u.id,
                  name: u.name,
                  exerciseIds: u.exerciseIds,
                }),
              }).catch((err) => {
                console.warn("[useWorkouts] Background sync error for routine:", u.id, err);
              });
            });
          }

          const merged = [...unsynced, ...remoteRoutines];
          saveLocalRoutines(merged, userId);
          setSavedRoutines(merged);
        }
      } catch (err) {
        console.warn("[useWorkouts] Offline fallback reading routines from API:", err);
      }
    }

    syncRoutines();

    return () => {
      isMounted = false;
    };
  }, [clerkLoaded, isSignedIn, userId]);

  // ──────────────────────────────────────────
  // Pre-sorted sessions (newest first)
  // ──────────────────────────────────────────
  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [sessions]
  );

  // ──────────────────────────────────────────
  // Derived: flat list of all workout logs (newest first)
  // ──────────────────────────────────────────
  const workouts = useMemo<WorkoutLog[]>(() => {
    return sortedSessions.flatMap((s) => s.logs);
  }, [sortedSessions]);

  // ──────────────────────────────────────────
  // Derived: lifetime set counts per exercise
  // ──────────────────────────────────────────
  const lifetimeSetCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const w of workouts) {
      counts[w.exerciseId] = (counts[w.exerciseId] ?? 0) + w.sets.length;
    }
    return counts;
  }, [workouts]);

  // ──────────────────────────────────────────
  // Derived: exercise with highest lifetime set count
  // ──────────────────────────────────────────
  const topExerciseId = useMemo<string | null>(() => {
    let topId: string | null = null;
    let topCount = 0;
    for (const [id, count] of Object.entries(lifetimeSetCounts)) {
      if (count > topCount) {
        topCount = count;
        topId = id;
      }
    }
    return topId;
  }, [lifetimeSetCounts]);

  // ──────────────────────────────────────────
  // Add a complete workout session
  // ──────────────────────────────────────────
  const addSession = useCallback(async (newSession: WorkoutSession) => {
    // 1. Always save to local state and localStorage immediately
    const current = loadLocalSessions(userId);
    const updated = [newSession, ...current.filter((s) => s.id !== newSession.id)];
    saveLocalSessions(updated, userId);
    setSessions(updated);
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
  }, [userId]);

  // ──────────────────────────────────────────
  // Delete an entire session (+ all its logs)
  // ──────────────────────────────────────────
  const deleteSession = useCallback(async (sessionId: string) => {
    // 1. Mark as pending deletion so server sync doesn't resurrect it
    markSessionDeleted(sessionId, userId);

    // 2. Remove from state and localStorage immediately
    const current = loadLocalSessions(userId);
    const updated = current.filter((s) => s.id !== sessionId);
    saveLocalSessions(updated, userId);
    setSessions(updated);

    // 3. Try to sync deletion to server
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (res.status === 503) return; // unconfigured
      if (res.ok || res.status === 404) {
        unmarkSessionDeleted(sessionId, userId);
      } else {
        console.warn(`[useWorkouts] Server deleteSession returned HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn("[useWorkouts] Could not sync deleteSession to server (offline):", err);
    }
  }, [userId]);

  // ──────────────────────────────────────────
  // Update an entire session's logs (inline editing)
  // ──────────────────────────────────────────
  const updateSession = useCallback(async (updatedSession: WorkoutSession) => {
    if (!updatedSession.logs || updatedSession.logs.length === 0) {
      await deleteSession(updatedSession.id);
      return;
    }

    const current = loadLocalSessions(userId);
    const updated = current.map((s) =>
      s.id === updatedSession.id ? updatedSession : s
    );
    saveLocalSessions(updated, userId);
    setSessions(updated);

    try {
      const res = await fetch(`/api/sessions/${updatedSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSession),
      });
      if (res.status === 503) return;
      if (!res.ok) {
        console.warn(`[useWorkouts] Server updateSession returned HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn("[useWorkouts] Could not sync updateSession to server (offline):", err);
    }
  }, [deleteSession, userId]);

  // ──────────────────────────────────────────
  // Update date/time for a session
  // ──────────────────────────────────────────
  const updateSessionDateTime = useCallback(
    async (sessionId: string, newDateISO: string) => {
      // 1. Update state and localStorage immediately
      const current = loadLocalSessions(userId);
      const updated = current.map((s) =>
        s.id === sessionId
          ? {
            ...s,
            date: newDateISO,
            logs: s.logs.map((l) => ({ ...l, date: newDateISO })),
          }
          : s
      );
      saveLocalSessions(updated, userId);
      setSessions(updated);

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
    [userId]
  );

  // ──────────────────────────────────────────
  // Delete individual workout log (used by Progress page)
  // ──────────────────────────────────────────
  const deleteWorkout = useCallback(async (logId: string) => {
    // 1. Remove log from state and localStorage immediately
    const current = loadLocalSessions(userId);
    const updated = current
      .map((s) => ({
        ...s,
        logs: s.logs.filter((l) => l.id !== logId),
      }))
      .filter((s) => s.logs.length > 0);
    saveLocalSessions(updated, userId);
    setSessions(updated);

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
  }, [userId]);

  // ──────────────────────────────────────────
  // Read helpers (derived from in-memory state)
  // ──────────────────────────────────────────
  const getWorkoutsForExercise = useCallback(
    (exerciseId: string) =>
      workouts
        .filter((w) => w.exerciseId === exerciseId)
        .slice()
        .reverse(),
    [workouts]
  );

  const getRecentWorkouts = useCallback(
    (limit = 10) => workouts.slice(0, limit),
    [workouts]
  );

  // Returns the most recent sets logged for an exercise (weight + reps + logged unit per set)
  const getLastEntryForExercise = useCallback(
    (exerciseId: string): { weight: number; reps: number; unit?: "kg" | "lbs" }[] | null => {
      const lastLog = workouts.find((w) => w.exerciseId === exerciseId);
      if (!lastLog) return null;
      return lastLog.sets.map((s) => ({
        weight: s.weight,
        reps: s.reps,
        unit: s.unit || lastLog.unit || "kg",
      }));
    },
    [workouts]
  );

  const getProgressData = useCallback(
    (exerciseId: string) => {
      return getWorkoutsForExercise(exerciseId).map((w) => {
        const convertedSets = w.sets.map((s) => ({
          ...s,
          convertedWeight: unitConvertWeight(s.weight, s.unit || w.unit || "kg", globalUnit),
        }));
        const maxWeight = Math.max(...convertedSets.map((s) => s.convertedWeight));
        const totalVolume = convertedSets.reduce(
          (sum, s) => sum + s.reps * s.convertedWeight,
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
    [getWorkoutsForExercise, unitConvertWeight, globalUnit]
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
      saveLocalSessions(updated, userId);
      return updated;
    });
  }, [userId]);

  // ──────────────────────────────────────────
  // Routine Operations (Dual-Layer Sync)
  // ──────────────────────────────────────────
  const addRoutine = useCallback(
    async (routineName: string, routineExercises: string[]) => {
      const newRoutine: SavedRoutine = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `rt_${Date.now()}`,
        name: routineName,
        exerciseIds: routineExercises,
      };

      const current = loadLocalRoutines(userId);
      const updated = [newRoutine, ...current.filter((r) => r.id !== newRoutine.id)];
      saveLocalRoutines(updated, userId);
      setSavedRoutines(updated);

      if (isSignedIn) {
        fetch("/api/routines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newRoutine.id,
            name: routineName,
            exerciseIds: routineExercises,
          }),
        }).catch((err) => {
          console.warn("[useWorkouts] Offline fallback inserting routine:", err);
        });
      }

      return newRoutine;
    },
    [isSignedIn, userId]
  );

  const updateRoutine = useCallback(
    async (routineId: string, routineName: string, routineExercises: string[]) => {
      const current = loadLocalRoutines(userId);
      const updated = current.map((r) =>
        r.id === routineId
          ? { ...r, name: routineName, exerciseIds: routineExercises }
          : r
      );
      saveLocalRoutines(updated, userId);
      setSavedRoutines(updated);

      if (isSignedIn) {
        fetch(`/api/routines/${routineId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: routineName,
            exerciseIds: routineExercises,
          }),
        }).catch((err) => {
          console.warn("[useWorkouts] Offline fallback updating routine:", err);
        });
      }
    },
    [isSignedIn, userId]
  );

  const deleteRoutine = useCallback(
    async (routineId: string) => {
      const current = loadLocalRoutines(userId);
      const updated = current.filter((r) => r.id !== routineId);
      saveLocalRoutines(updated, userId);
      setSavedRoutines(updated);

      if (isSignedIn) {
        fetch(`/api/routines/${routineId}`, {
          method: "DELETE",
        }).catch((err) => {
          console.warn("[useWorkouts] Offline fallback deleting routine:", err);
        });
      }
    },
    [isSignedIn, userId]
  );

  return {
    workouts,
    sessions: sortedSessions,
    isLoaded,
    isSaving,
    isOffline,
    // Custom Routines
    savedRoutines,
    setSavedRoutines,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    // Global unit system
    globalUnit,
    setGlobalUnit,
    toggleGlobalUnit,
    convertWeight: unitConvertWeight,
    formatWeight: unitFormatWeight,
    // E1RM calculator
    calculateE1RM,
    // Derived helpers
    lifetimeSetCounts,
    topExerciseId,
    // Write operations
    addSession,
    updateSession,
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
        saveLocalSessions(newSessions, userId);
        return newSessions;
      });
    },
  };
}
