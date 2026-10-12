"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Exercise, WorkoutSet } from "@/types";
import { useUnit, UNIT_STORAGE_KEY } from "@/contexts/unit-context";
import { useAuth } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionExerciseSet extends WorkoutSet {
  unit: "kg" | "lbs"; // make unit required (WorkoutSet has it optional)
  completed: boolean;
}

export interface SessionExerciseItem {
  id: string;
  exercise: Exercise;
  restTimerSeconds: number;
  sets: SessionExerciseSet[];
  timerActive: boolean;
  timerKey: number;
}

interface ActiveSessionState {
  isActive: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  sessionDate: string;
  unit: "kg" | "lbs";
  exercises: SessionExerciseItem[];
}

interface SessionContextValue extends ActiveSessionState {
  startSession: (initialExercises?: Exercise[]) => void;
  cancelSession: () => void;
  setSessionDate: (date: string) => void;
  setUnit: (unit: "kg" | "lbs") => void;
  toggleUnit: (targetUnit?: "kg" | "lbs") => void;
  setExercises: React.Dispatch<React.SetStateAction<SessionExerciseItem[]>>;
  totalPlannedSets: number;
  totalCompletedSets: number;
  liveVolume: number;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn, userId } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString());
  const { globalUnit, setGlobalUnit } = useUnit();
  const unit = globalUnit;
  const [exercises, setExercises] = useState<SessionExerciseItem[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. On Clerk auth load / user login: Query preferred_unit from user_settings
  useEffect(() => {
    if (!clerkLoaded || !isSignedIn || !userId) return;

    let isMounted = true;
    async function loadUserUnit() {
      const client = supabase;
      if (!client) return;
      try {
        const { data, error } = await client
          .from("user_settings")
          .select("preferred_unit")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.warn("[SessionContext] Error fetching unit from user_settings:", error.message);
          return;
        }

        if (isMounted && data?.preferred_unit) {
          const pref = data.preferred_unit;
          if (pref === "kg" || pref === "lbs") {
            setGlobalUnit(pref);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(UNIT_STORAGE_KEY, pref);
              } catch {}
            }
          }
        }
      } catch (err) {
        console.warn("[SessionContext] Offline fallback for user_settings unit:", err);
      }
    }

    loadUserUnit();

    return () => {
      isMounted = false;
    };
  }, [clerkLoaded, isSignedIn, userId, setGlobalUnit]);

  // 2. On unit toggle: Upsert into user_settings
  const setUnit = useCallback(
    (newUnit: "kg" | "lbs") => {
      setGlobalUnit(newUnit);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(UNIT_STORAGE_KEY, newUnit);
        } catch {}
      }

      const client = supabase;
      if (userId && client) {
        client
          .from("user_settings")
          .upsert(
            {
              user_id: userId,
              preferred_unit: newUnit,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          )
          .then(({ error }) => {
            if (error) {
              console.warn("[SessionContext] Error saving unit to Supabase:", error.message);
            }
          });
      }
    },
    [userId, setGlobalUnit]
  );

  const toggleUnit = useCallback(
    (targetUnit?: "kg" | "lbs") => {
      const nextUnit: "kg" | "lbs" = targetUnit || (unit === "kg" ? "lbs" : "kg");
      setUnit(nextUnit);
    },
    [unit, setUnit]
  );


  useEffect(() => {
    if (isActive && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, startTime]);

  const startSession = useCallback((initialExercises: Exercise[] = []) => {
    const now = Date.now();
    setStartTime(now);
    setElapsedSeconds(0);
    setSessionDate(new Date().toISOString());
    setIsActive(true);

    if (initialExercises.length > 0) {
      setExercises(
        initialExercises.map((ex) => ({
          id: crypto.randomUUID(),
          exercise: ex,
          restTimerSeconds: 120,
          timerActive: false,
          timerKey: 0,
          sets: [
            { setNumber: 1, reps: 0, weight: 0, unit: globalUnit, completed: false },
            { setNumber: 2, reps: 0, weight: 0, unit: globalUnit, completed: false },
            { setNumber: 3, reps: 0, weight: 0, unit: globalUnit, completed: false },
          ],
        }))
      );
    } else {
      setExercises([]);
    }
  }, [globalUnit]);

  const cancelSession = useCallback(() => {
    setIsActive(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setExercises([]);
  }, []);

  const totalPlannedSets = exercises.reduce((s, e) => s + e.sets.length, 0);
  const totalCompletedSets = exercises.reduce(
    (s, e) => s + e.sets.filter((set) => set.completed).length,
    0
  );
  const liveVolume = exercises.reduce(
    (s, e) =>
      s +
      e.sets
        .filter((set) => set.completed)
        .reduce((ss, set) => ss + set.reps * set.weight, 0),
    0
  );

  return (
    <SessionContext.Provider
      value={{
        isActive,
        startTime,
        elapsedSeconds,
        sessionDate,
        unit,
        exercises,
        startSession,
        cancelSession,
        setSessionDate,
        setUnit,
        toggleUnit,
        setExercises,
        totalPlannedSets,
        totalCompletedSets,
        liveVolume,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
