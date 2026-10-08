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
  setExercises: React.Dispatch<React.SetStateAction<SessionExerciseItem[]>>;
  totalPlannedSets: number;
  totalCompletedSets: number;
  liveVolume: number;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString());
  const { globalUnit, setGlobalUnit } = useUnit();
  const unit = globalUnit;
  const [exercises, setExercises] = useState<SessionExerciseItem[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const setUnit = useCallback(
    (newUnit: "kg" | "lbs") => {
      setGlobalUnit(newUnit);
    },
    [setGlobalUnit]
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
  }, []);

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
