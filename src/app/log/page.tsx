"use client";

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { exercises, muscleGroups, muscleGroupColors } from "@/lib/exercises";
import { useWorkouts } from "@/hooks/use-workouts";
import { useSession } from "@/contexts/session-context";
import { useUnit } from "@/contexts/unit-context";
import { Exercise, WorkoutSet, WorkoutLog, WorkoutSession } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ScrollingTimerPicker,
  formatIntervalLabel,
} from "@/components/timer/scrolling-timer-picker";
import { ExerciseInlineTimer } from "@/components/timer/exercise-inline-timer";
import {
  Play,
  Check,
  Plus,
  Trash2,
  Timer,
  Clock,
  Dumbbell,
  CheckCircle2,
  Search,
  X,
  Flame,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Calendar as CalendarIcon,
  Edit2,
  AlertTriangle,
  Layers,
  Ban,
} from "lucide-react";
import Link from "next/link";

// Local types only used inside the active session (sets extended with completion state)
interface SessionExerciseSet extends WorkoutSet {
  completed: boolean;
}

interface SessionExerciseItem {
  id: string;
  exercise: Exercise;
  restTimerSeconds: number;
  sets: SessionExerciseSet[];
  timerActive: boolean;
  timerKey: number;
}

// Helpers for date and time formatting
function formatSessionDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function toLocalDatetimeInput(dateOrIso?: string | Date): string {
  const d = dateOrIso ? new Date(dateOrIso) : new Date();
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// ─── Custom Routine Types ───────────────────────────────────────────────────
interface SavedRoutine {
  id: string;
  name: string;
  exerciseIds: string[];
}

const ROUTINES_KEY = "hypertrophy_custom_routines";

function loadRoutines(): SavedRoutine[] {
  try {
    const raw = localStorage.getItem(ROUTINES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRoutinesToStorage(routines: SavedRoutine[]) {
  try {
    localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  } catch { }
}

// ─── WorkoutCalendar ─────────────────────────────────────────────────────────
// Interactive calendar that shows emerald dot indicators on days with workouts.
// Clicking a date reveals a compact session detail panel below the calendar.
function WorkoutCalendar({
  sessions,
  onEditDate,
  onDeleteRequest,
}: {
  sessions: WorkoutSession[];
  onEditDate: (session: WorkoutSession) => void;
  onDeleteRequest: (session: WorkoutSession) => void;
}) {
  const { globalUnit, convertWeight } = useUnit();
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Build a map of dateKey (YYYY-MM-DD) -> sessions[]
  const sessionsByDate = useMemo<Record<string, WorkoutSession[]>>(() => {
    const map: Record<string, WorkoutSession[]> = {};
    for (const s of sessions) {
      const d = new Date(s.date);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    // Sort each day's sessions by time descending (most recent first)
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return map;
  }, [sessions]);

  // Modifiers — days that have at least one workout
  const workoutDays = useMemo(
    () => Object.keys(sessionsByDate).map((k) => new Date(k + "T00:00:00")),
    [sessionsByDate]
  );

  const selectedDateKey = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : null;

  const selectedSessions = selectedDateKey ? (sessionsByDate[selectedDateKey] ?? []) : [];

  function formatSessionTime(seconds: number) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return (
    <div className="space-y-3">
      {sessions.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card p-6 text-center space-y-2">
          <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <div className="text-xs font-semibold text-foreground">No sessions logged yet</div>
          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
            Start a session above. Completed sessions will appear here with calendar indicators.
          </p>
        </div>
      ) : (
        <>
          {/* Calendar container */}
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(day) => {
                if (!day) { setSelectedDate(undefined); return; }
                const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                // Toggle off if re-clicking same day with no sessions
                if (selectedDate && selectedDate.toDateString() === day.toDateString()) {
                  setSelectedDate(undefined);
                } else {
                  setSelectedDate(day);
                }
              }}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              modifiers={{ workout: workoutDays }}
              modifiersClassNames={{
                workout: "relative",
              }}
              components={{
                DayButton: ({ day, modifiers, ...props }) => {
                  const d = day.date;
                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  const hasWorkout = !!sessionsByDate[key];
                  const count = sessionsByDate[key]?.length ?? 0;
                  const isSelected = selectedDate?.toDateString() === d.toDateString();
                  return (
                    <button
                      {...props}
                      className={[
                        props.className,
                        "relative flex flex-col items-center justify-center w-full h-full rounded-md transition-colors",
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : hasWorkout
                            ? "hover:bg-emerald-500/10 text-foreground font-semibold"
                            : "hover:bg-secondary/60 text-foreground",
                        modifiers.today && !isSelected ? "ring-1 ring-blue-400/60" : "",
                        modifiers.outside ? "opacity-30" : "",
                      ].filter(Boolean).join(" ")}
                    >
                      <span className="text-[13px] leading-none">{d.getDate()}</span>
                      {hasWorkout && (
                        <span className={`mt-0.5 flex gap-px ${isSelected ? "opacity-90" : ""}`}>
                          {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                            <span
                              key={i}
                              className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/80" : "bg-emerald-400"}`}
                            />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                },
              }}
              className="w-full [--cell-size:--spacing(10)]"
            />
            {/* Legend */}
            <div className="px-3 pb-3 flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border/30 pt-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Workout logged
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded ring-1 ring-blue-400/60 inline-block" />
                Today
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                Selected
              </span>
            </div>
          </div>

          {/* Selected date sessions panel */}
          {selectedDate && (
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3.5 py-2.5 border-b border-border/40 bg-secondary/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-foreground">
                    {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                    {selectedSessions.length} {selectedSessions.length === 1 ? "session" : "sessions"}
                  </span>
                  <button
                    onClick={() => setSelectedDate(undefined)}
                    className="p-1 rounded text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {selectedSessions.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No workouts logged on this day.
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {selectedSessions.map((session, idx) => {
                    const sessionDate = new Date(session.date);
                    const timeStr = !isNaN(sessionDate.getTime())
                      ? sessionDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                      : null;
                    const totalSets = session.logs.reduce((s, l) => s + l.sets.length, 0);
                    const totalVol = session.logs.reduce(
                      (s, l) =>
                        s +
                        l.sets.reduce(
                          (ss, set) =>
                            ss +
                            set.reps *
                              convertWeight(
                                set.weight,
                                set.unit || l.unit || "kg",
                                globalUnit
                              ),
                          0
                        ),
                      0
                    );

                    return (
                      <div key={session.id} className="p-3 space-y-2 hover:bg-secondary/20 transition-colors">
                        {/* Session header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-mono font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            {timeStr && <span className="text-foreground font-semibold">{timeStr}</span>}
                            {session.durationSeconds && session.durationSeconds > 0 && (
                              <span className="text-muted-foreground flex items-center gap-0.5">
                                <Clock className="w-3 h-3 text-cyan-400" />
                                {formatSessionTime(session.durationSeconds)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditDate(session)}
                              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10"
                              title="Adjust date/time"
                            >
                              <Edit2 className="w-2.5 h-2.5 mr-0.5" /> Date
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteRequest(session)}
                              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Delete session"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Exercise pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {session.logs.map((log) => {
                            const maxWt =
                              log.sets.length > 0
                                ? Math.max(
                                    ...log.sets.map((s) =>
                                      convertWeight(
                                        s.weight,
                                        s.unit || log.unit || "kg",
                                        globalUnit
                                      )
                                    )
                                  )
                                : 0;
                            return (
                              <div
                                key={log.id}
                                className="px-2 py-0.5 rounded-md bg-secondary/40 border border-border/40 text-[10px] font-medium flex items-center gap-1.5"
                              >
                                <span className="font-semibold truncate max-w-[110px]">{log.exerciseName}</span>
                                <span className="text-muted-foreground">{log.sets.length}s</span>
                                <span className="font-mono text-blue-400 font-bold">{maxWt} {globalUnit}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Volume footer */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/20">
                          <span>{session.logs.length} {session.logs.length === 1 ? "exercise" : "exercises"} · {totalSets} sets</span>
                          <span className="font-mono font-bold text-foreground">{Math.round(totalVol).toLocaleString()} {globalUnit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}


function WorkoutSessionManager() {
  const searchParams = useSearchParams();
  const preselectedExerciseId = searchParams.get("exercise");

  const {
    addSession,
    sessions,
    deleteSession,
    updateSessionDateTime,
    getLastEntryForExercise,
    globalUnit,
    convertWeight,
  } = useWorkouts();

  // ─── Global Session Context ───────────────────────────────────────────────
  const {
    isActive: sessionActive,
    elapsedSeconds: sessionElapsedSeconds,
    sessionDate,
    unit,
    exercises: sessionExercises,
    startSession: ctxStartSession,
    cancelSession: ctxCancelSession,
    setSessionDate,
    setUnit,
    setExercises: setSessionExercises,
  } = useSession();

  // ─── Custom Routines State ────────────────────────────────────────────────
  // Initialize empty to match SSR, then hydrate from localStorage on client mount
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>([]);
  const [routineBuilderOpen, setRoutineBuilderOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<SavedRoutine | null>(null);
  const [routineName, setRoutineName] = useState("");
  const [routineExerciseIds, setRoutineExerciseIds] = useState<string[]>([]);
  const [routinePickerOpen, setRoutinePickerOpen] = useState(false);
  const [routinePickerSearch, setRoutinePickerSearch] = useState("");
  const [routinePickerMuscle, setRoutinePickerMuscle] = useState("");
  const [deleteRoutineId, setDeleteRoutineId] = useState<string | null>(null);

  // Hydrate savedRoutines from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setSavedRoutines(loadRoutines());
  }, []);

  const persistRoutines = useCallback((routines: SavedRoutine[]) => {
    setSavedRoutines(routines);
    saveRoutinesToStorage(routines);
  }, []);

  const openNewRoutineBuilder = () => {
    setEditingRoutine(null);
    setRoutineName("");
    setRoutineExerciseIds([]);
    setRoutineBuilderOpen(true);
  };

  const openEditRoutineBuilder = (routine: SavedRoutine) => {
    setEditingRoutine(routine);
    setRoutineName(routine.name);
    setRoutineExerciseIds([...routine.exerciseIds]);
    setRoutineBuilderOpen(true);
  };

  const saveRoutine = () => {
    if (!routineName.trim() || routineExerciseIds.length === 0) return;
    if (editingRoutine) {
      const updated = savedRoutines.map((r) =>
        r.id === editingRoutine.id
          ? { ...r, name: routineName.trim(), exerciseIds: routineExerciseIds }
          : r
      );
      persistRoutines(updated);
    } else {
      const newRoutine: SavedRoutine = {
        id: crypto.randomUUID(),
        name: routineName.trim(),
        exerciseIds: routineExerciseIds,
      };
      persistRoutines([...savedRoutines, newRoutine]);
    }
    setRoutineBuilderOpen(false);
  };

  const confirmDeleteRoutine = () => {
    if (!deleteRoutineId) return;
    persistRoutines(savedRoutines.filter((r) => r.id !== deleteRoutineId));
    setDeleteRoutineId(null);
  };

  const launchRoutine = (routine: SavedRoutine) => {
    const exs = routine.exerciseIds
      .map((id) => exercises.find((e) => e.id === id))
      .filter(Boolean) as typeof exercises;
    startNewSession(exs);
  };

  const filteredRoutinePickerExercises = useMemo(() => {
    return exercises.filter((e) => {
      const matchSearch =
        !routinePickerSearch ||
        e.name.toLowerCase().includes(routinePickerSearch.toLowerCase()) ||
        e.primaryMuscle.toLowerCase().includes(routinePickerSearch.toLowerCase());
      const matchMuscle =
        !routinePickerMuscle ||
        e.primaryMuscle === routinePickerMuscle ||
        e.secondaryMuscle === routinePickerMuscle;
      return matchSearch && matchMuscle;
    });
  }, [routinePickerSearch, routinePickerMuscle]);

  // ─── Exercise Picker Modal State ──────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);
  const [pickerSearch, setPickerSearch] = useState<string>("");
  const [pickerMuscle, setPickerMuscle] = useState<string>("");

  // Scrolling Timer Picker state
  const [timerPickerExerciseId, setTimerPickerExerciseId] = useState<string | null>(null);

  // Active Session Date/Time Edit Modal
  const [activeDateModalOpen, setActiveDateModalOpen] = useState<boolean>(false);
  const [activeDateInputValue, setActiveDateInputValue] = useState<string>("");

  // Saved Session Date/Time Edit Modal
  const [editSessionModalData, setEditSessionModalData] = useState<{
    sessionId: string;
    currentIso: string;
  } | null>(null);
  const [editSessionDateInput, setEditSessionDateInput] = useState<string>("");

  // Delete Session Confirmation Modal
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<WorkoutSession | null>(null);

  // ─── Cancel Session AlertDialog ───────────────────────────────────────────
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  // ─── Empty Session Warning Modal ──────────────────────────────────────────
  const [emptySessionAlertOpen, setEmptySessionAlertOpen] = useState(false);

  // Session Completion Modal
  const [finishedSummary, setFinishedSummary] = useState<{
    durationText: string;
    durationSeconds: number;
    totalSets: number;
    totalVolume: number;
    sessionDate: string;
    exerciseCount: number;
    exercisesSummary: { name: string; setsCount: number; maxWeight: number }[];
  } | null>(null);

  // Pre-load exercise if URL has ?exercise=
  useEffect(() => {
    if (preselectedExerciseId && !sessionActive) {
      const ex = exercises.find((e) => e.id === preselectedExerciseId);
      if (ex) {
        startNewSession([ex]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedExerciseId]);

  // Filter exercises in picker
  const filteredPickerExercises = useMemo(() => {
    return exercises.filter((e) => {
      const matchSearch =
        !pickerSearch ||
        e.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        e.primaryMuscle.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        e.secondaryMuscle.toLowerCase().includes(pickerSearch.toLowerCase());
      const matchMuscle =
        !pickerMuscle ||
        e.primaryMuscle === pickerMuscle ||
        e.secondaryMuscle === pickerMuscle;
      return matchSearch && matchMuscle;
    });
  }, [pickerSearch, pickerMuscle]);

  // Format MM:SS or HH:MM:SS
  const formatSessionTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Build initial sets for an exercise, using last-entry values if available
  const buildInitialSets = useCallback(
    (ex: Exercise): SessionExerciseSet[] => {
      const last = getLastEntryForExercise(ex.id);
      if (last && last.length > 0) {
        return last.map((s, idx) => ({
          setNumber: idx + 1,
          reps: s.reps,
          weight: convertWeight(s.weight, s.unit || "kg", globalUnit),
          unit: globalUnit,
          completed: false,
        }));
      }
      // Default 3 sets — 0 weight/reps when no prior history exists
      return [
        { setNumber: 1, reps: 0, weight: 0, unit: globalUnit, completed: false },
        { setNumber: 2, reps: 0, weight: 0, unit: globalUnit, completed: false },
        { setNumber: 3, reps: 0, weight: 0, unit: globalUnit, completed: false },
      ];
    },
    [getLastEntryForExercise, convertWeight, globalUnit]
  );

  const startNewSession = (initialExercises: Exercise[] = []) => {
    setFinishedSummary(null);
    if (initialExercises.length > 0) {
      ctxStartSession(initialExercises);
      // Override default sets with last-entry values
      setSessionExercises(
        initialExercises.map((ex) => ({
          id: crypto.randomUUID(),
          exercise: ex,
          restTimerSeconds: 120,
          timerActive: false,
          timerKey: 0,
          sets: buildInitialSets(ex),
        }))
      );
    } else {
      ctxStartSession([]);
      setPickerOpen(true);
    }
  };

  const addExerciseToSession = (exercise: Exercise) => {
    const newItem: SessionExerciseItem = {
      id: crypto.randomUUID(),
      exercise,
      restTimerSeconds: 120,
      timerActive: false,
      timerKey: 0,
      sets: buildInitialSets(exercise),
    };
    setSessionExercises((prev) => [...prev, newItem]);
    setPickerOpen(false);
    setPickerSearch("");
    setPickerMuscle("");
  };

  const removeExerciseFromSession = (itemId: string) => {
    setSessionExercises((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateExerciseRestTimer = (itemId: string, seconds: number) => {
    setSessionExercises((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, restTimerSeconds: seconds } : item
      )
    );
  };

  const addSetToExercise = (itemId: string) => {
    setSessionExercises((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const lastSet = item.sets[item.sets.length - 1];
          const newSet: SessionExerciseSet = {
            setNumber: item.sets.length + 1,
            reps: lastSet ? lastSet.reps : 0,
            weight: lastSet ? lastSet.weight : 0,
            unit: globalUnit,
            completed: false,
          };
          return { ...item, sets: [...item.sets, newSet] };
        }
        return item;
      })
    );
  };

  const removeSetFromExercise = (itemId: string, setIndex: number) => {
    setSessionExercises((prev) =>
      prev.map((item) => {
        if (item.id === itemId && item.sets.length > 1) {
          const updatedSets = item.sets
            .filter((_, idx) => idx !== setIndex)
            .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
          return { ...item, sets: updatedSets };
        }
        return item;
      })
    );
  };

  const updateSetValues = (
    itemId: string,
    setIndex: number,
    field: "weight" | "reps",
    value: number
  ) => {
    setSessionExercises((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedSets = item.sets.map((s, idx) =>
            idx === setIndex ? { ...s, [field]: value } : s
          );
          return { ...item, sets: updatedSets };
        }
        return item;
      })
    );
  };

  // Checking off a set -> Triggers the rest timer INSIDE that exercise box
  const toggleSetComplete = (itemId: string, setIndex: number) => {
    setSessionExercises((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedSets = item.sets.map((s, idx) => {
            if (idx === setIndex) {
              const nextState = !s.completed;
              return { ...s, completed: nextState };
            }
            return s;
          });

          const justCompleted = !item.sets[setIndex].completed;
          return {
            ...item,
            sets: updatedSets,
            timerActive: justCompleted ? true : item.timerActive,
            timerKey: justCompleted ? item.timerKey + 1 : item.timerKey,
          };
        }
        return item;
      })
    );
  };

  const startRestForExercise = (itemId: string) => {
    setSessionExercises((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, timerActive: true, timerKey: item.timerKey + 1 }
          : item
      )
    );
  };

  const dismissExerciseTimer = (itemId: string) => {
    setSessionExercises((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, timerActive: false } : item
      )
    );
  };

  // Finish session & save complete session entity
  const finishSession = () => {
    // 1. Empty Session Guard: Check if ANY sets are marked as completed/done across all exercises
    const totalDoneSetsAcrossAll = sessionExercises.reduce(
      (sum, item) => sum + item.sets.filter((s) => s.completed).length,
      0
    );

    if (totalDoneSetsAcrossAll === 0) {
      setEmptySessionAlertOpen(true);
      return;
    }

    const sessionId = crypto.randomUUID();
    const completedLogs: WorkoutLog[] = [];
    let totalCompletedSets = 0;
    let totalVolumeLifted = 0;
    const summaryList: { name: string; setsCount: number; maxWeight: number }[] =
      [];

    const finalSessionDateISO = sessionDate || new Date().toISOString();

    // 2. Strict Done Set Filtering: filter out and discard all sets that were NOT explicitly marked done
    sessionExercises.forEach((item) => {
      const finishedSets = item.sets.filter((s) => s.completed);

      // Only log exercises that have at least 1 set marked done
      if (finishedSets.length > 0) {
        const log: WorkoutLog = {
          id: crypto.randomUUID(),
          sessionId: sessionId,
          date: finalSessionDateISO,
          exerciseId: item.exercise.id,
          exerciseName: item.exercise.name,
          sets: finishedSets.map((s, idx) => ({
            setNumber: idx + 1,
            reps: s.reps,
            weight: s.weight,
            unit: unit,
          })),
          unit: unit,
        };

        completedLogs.push(log);
        totalCompletedSets += finishedSets.length;
        const exVolume = finishedSets.reduce(
          (sum, s) => sum + s.reps * s.weight,
          0
        );
        totalVolumeLifted += exVolume;
        const maxWt = Math.max(...finishedSets.map((s) => s.weight));

        summaryList.push({
          name: item.exercise.name,
          setsCount: finishedSets.length,
          maxWeight: maxWt,
        });
      }
    });

    if (completedLogs.length > 0) {
      const newSession: WorkoutSession = {
        id: sessionId,
        date: finalSessionDateISO,
        durationSeconds: sessionElapsedSeconds,
        logs: completedLogs,
      };
      addSession(newSession);
    }

    const durationText = formatSessionTime(sessionElapsedSeconds);

    setFinishedSummary({
      durationText,
      durationSeconds: sessionElapsedSeconds,
      totalSets: totalCompletedSets,
      totalVolume: totalVolumeLifted,
      sessionDate: finalSessionDateISO,
      exerciseCount: completedLogs.length,
      exercisesSummary: summaryList,
    });

    ctxCancelSession();
  };

  // Open active date modal
  const openActiveDateModal = () => {
    setActiveDateInputValue(toLocalDatetimeInput(sessionDate));
    setActiveDateModalOpen(true);
  };

  // Save active session date
  const saveActiveDate = () => {
    if (activeDateInputValue) {
      const parsed = new Date(activeDateInputValue);
      if (!isNaN(parsed.getTime())) {
        setSessionDate(parsed.toISOString());
      }
    }
    setActiveDateModalOpen(false);
  };

  // Open saved session date edit modal
  const openEditSessionDateModal = (session: WorkoutSession) => {
    setEditSessionModalData({
      sessionId: session.id,
      currentIso: session.date,
    });
    setEditSessionDateInput(toLocalDatetimeInput(session.date));
  };

  // Save edited date for a saved session
  const saveEditedSessionDate = () => {
    if (editSessionModalData && editSessionDateInput) {
      const parsed = new Date(editSessionDateInput);
      if (!isNaN(parsed.getTime())) {
        updateSessionDateTime(
          editSessionModalData.sessionId,
          parsed.toISOString()
        );
      }
    }
    setEditSessionModalData(null);
  };

  // Confirm delete of a saved session
  const handleDeleteSessionConfirm = () => {
    if (deleteConfirmSession) {
      deleteSession(deleteConfirmSession.id);
      setDeleteConfirmSession(null);
    }
  };

  // Selected item for scrolling picker
  const activePickerExercise = sessionExercises.find(
    (e) => e.id === timerPickerExerciseId
  );

  // ----------------------------------------------------
  // RENDER: Session Finished Summary
  // ----------------------------------------------------
  if (finishedSummary) {
    return (
      <div className="max-w-xl mx-auto space-y-4 py-4 px-2 animate-fade-in-up">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/15 via-blue-500/10 to-cyan-500/15 border border-green-500/30 p-5 text-center space-y-2.5">
          <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto text-green-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Session Completed!
          </h1>
          <div className="text-xs text-blue-400 font-mono flex items-center justify-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{formatSessionDateTime(finishedSummary.sessionDate)}</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Progressive overload recorded for your progressive graphs.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/40">
            <div className="bg-card/80 p-2.5 rounded-xl border border-border/50">
              <div className="text-[10px] text-muted-foreground">Duration</div>
              <div className="text-base font-bold font-mono text-blue-400">
                {finishedSummary.durationText}
              </div>
            </div>
            <div className="bg-card/80 p-2.5 rounded-xl border border-border/50">
              <div className="text-[10px] text-muted-foreground">Sets Done</div>
              <div className="text-base font-bold font-mono text-foreground">
                {finishedSummary.totalSets}
              </div>
            </div>
            <div className="bg-card/80 p-2.5 rounded-xl border border-border/50">
              <div className="text-[10px] text-muted-foreground">Volume</div>
              <div className="text-base font-bold font-mono text-cyan-400">
                {finishedSummary.totalVolume.toLocaleString()} {globalUnit}
              </div>
            </div>
          </div>
        </div>

        {/* Exercises Breakdown */}
        <div className="bg-card border border-border/60 rounded-xl p-3.5 space-y-2">
          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Exercises Logged ({finishedSummary.exercisesSummary.length})
          </div>
          <div className="space-y-1.5">
            {finishedSummary.exercisesSummary.map((ex, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 text-xs"
              >
                <div>
                  <div className="font-semibold">{ex.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {ex.setsCount} working sets
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-blue-400">
                  Top: {ex.maxWeight} {globalUnit}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/progress" className="flex-1">
            <Button className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> View Progress Graph
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => setFinishedSummary(null)}
            className="flex-1 h-10 border-border text-xs text-muted-foreground hover:text-foreground"
          >
            Session List
          </Button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: Active Session Workspace (Clean, Compact, Mobile-First)
  // ----------------------------------------------------
  if (sessionActive) {
    const totalPlannedSets = sessionExercises.reduce(
      (sum, e) => sum + e.sets.length,
      0
    );
    const totalCompletedSets = sessionExercises.reduce(
      (sum, e) => sum + e.sets.filter((s) => s.completed).length,
      0
    );
    const liveVolume = sessionExercises.reduce(
      (sum, e) =>
        sum +
        e.sets
          .filter((s) => s.completed)
          .reduce((sSum, s) => sSum + s.reps * s.weight, 0),
      0
    );

    return (
      <div className="space-y-3.5 max-w-3xl mx-auto pb-24 px-1 sm:px-0">
        {/* Top Session Control Bar - Static Scrolling Layout */}
        <div className="w-full bg-card border border-border/70 rounded-xl shadow-sm p-2.5 sm:p-3">
          <div className="w-full space-y-2.5">
            {/* Row 1 (Timer & Date Picker) */}
            <div className="flex items-center justify-between w-full">
              {/* Left side: Active session timer badge */}
              <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-bold text-sm">
                <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>{formatSessionTime(sessionElapsedSeconds)}</span>
              </div>

              {/* Right side: Date picker button */}
              <button
                type="button"
                onClick={openActiveDateModal}
                className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-secondary/70 hover:bg-secondary border border-border/50 text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                title="Adjust session date & time"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  {new Date(sessionDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <Edit2 className="w-2.5 h-2.5 opacity-60 ml-0.5 shrink-0" />
              </button>
            </div>

            {/* Row 2 (Unit Toggle & Finish Actions) */}
            <div className="flex items-center justify-between w-full">
              {/* Left side: Weight unit toggle switch */}
              <div className="flex bg-secondary rounded-lg p-0.5 text-[11px] h-9 items-center border border-border/40">
                <button
                  type="button"
                  onClick={() => setUnit("kg")}
                  className={`px-3 py-1 rounded-md font-semibold transition-all h-7.5 ${unit === "kg"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => setUnit("lbs")}
                  className={`px-3 py-1 rounded-md font-semibold transition-all h-7.5 ${unit === "lbs"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  lbs
                </button>
              </div>

              {/* Right side: Grouped action buttons (Cancel + Finish) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCancelConfirmOpen(true)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                  title="Cancel workout — discard all sets"
                >
                  <Ban className="w-4 h-4" />
                </button>

                <Button
                  onClick={finishSession}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3 rounded-lg shadow-sm whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> Finish
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Exercises List */}
        {sessionExercises.length === 0 ? (
          <Card className="border-border/60 bg-card border-dashed">
            <CardContent className="py-12 text-center space-y-2.5">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto text-blue-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold">Your session is empty</h2>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Add exercises for today (e.g. Bench Press, Squats, Curls) and pre-set weights and reps.
              </p>
              <Button
                size="sm"
                onClick={() => setPickerOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-4"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Exercise
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessionExercises.map((item, exIdx) => {
              const primaryColors =
                muscleGroupColors[item.exercise.primaryMuscle];
              const secondaryColors =
                muscleGroupColors[item.exercise.secondaryMuscle];

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden transition-all"
                >
                  {/* Compact Header for Exercise Box */}
                  <div className="px-3 py-2.5 border-b border-border/40 bg-secondary/20 flex items-center justify-between gap-2">
                    {/* Left: Exercise Name & Badges */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-muted-foreground font-bold">
                          #{exIdx + 1}
                        </span>
                        <h2 className="font-bold text-sm text-foreground truncate">
                          {item.exercise.name}
                        </h2>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${primaryColors.bg} ${primaryColors.text}`}
                        >
                          {item.exercise.primaryMuscle}
                        </span>
                        <span className="text-[9px] text-muted-foreground truncate">
                          • {item.exercise.secondaryMuscle}
                        </span>
                      </div>
                    </div>

                    {/* Right: Rest Button + Inline Timer Beside It + Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Active Countdown Timer Directly Inside This Exercise Box! */}
                      {item.timerActive && (
                        <ExerciseInlineTimer
                          key={`${item.id}-${item.timerKey}`}
                          durationSeconds={item.restTimerSeconds}
                          isActive={item.timerActive}
                          exerciseName={item.exercise.name}
                          onDismiss={() => dismissExerciseTimer(item.id)}
                        />
                      )}

                      {/* Customizable Rest Timer Button (Opens 15s-interval scrolling picker) */}
                      <button
                        type="button"
                        onClick={() => setTimerPickerExerciseId(item.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/80 hover:bg-secondary border border-border/60 hover:border-blue-500/40 text-[11px] font-medium text-foreground transition-all"
                        title="Click to customize rest timer in 15-second intervals"
                      >
                        <Timer className="w-3 h-3 text-blue-400" />
                        <span className="font-mono font-semibold">
                          {formatIntervalLabel(item.restTimerSeconds)}
                        </span>
                      </button>

                      {/* Manual Quick Rest Start (if not already running) */}
                      {!item.timerActive && (
                        <button
                          type="button"
                          onClick={() => startRestForExercise(item.id)}
                          className="px-1.5 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-semibold transition-colors"
                          title="Start rest timer manually"
                        >
                          Rest
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => removeExerciseFromSession(item.id)}
                        className="p-1 rounded text-muted-foreground/60 hover:text-destructive transition-colors ml-0.5"
                        title="Remove exercise"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Compact Sets Table (Clean Mobile Layout) */}
                  <div className="p-2.5 sm:p-3 space-y-1.5">
                    {/* Compact Table Header */}
                    <div className="grid grid-cols-[26px_1fr_1fr_64px_24px] gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-1">
                      <span>Set</span>
                      <span className="text-center">{unit}</span>
                      <span className="text-center">Reps</span>
                      <span className="text-center">Done</span>
                      <span></span>
                    </div>

                    {/* Sets Rows */}
                    <div className="space-y-1">
                      {item.sets.map((set, setIdx) => (
                        <div
                          key={setIdx}
                          className={`grid grid-cols-[26px_1fr_1fr_64px_24px] gap-1.5 items-center p-1 rounded-lg transition-all ${set.completed
                            ? "bg-green-500/10 border border-green-500/30"
                            : "bg-secondary/20 hover:bg-secondary/40 border border-transparent"
                            }`}
                        >
                          {/* Set number */}
                          <div
                            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold ${set.completed
                              ? "bg-green-500/20 text-green-400"
                              : "text-muted-foreground font-semibold"
                              }`}
                          >
                            {set.setNumber}
                          </div>

                          {/* Weight input */}
                          <div className="flex flex-col gap-0.5">
                            <Input
                              type="number"
                              min={0}
                              step={0.5}
                              value={set.weight || ""}
                              onChange={(e) =>
                                updateSetValues(
                                  item.id,
                                  setIdx,
                                  "weight",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className="bg-secondary/40 border-border/60 h-8 text-center font-bold text-xs rounded-md px-1"
                            />
                          </div>

                          {/* Reps input */}
                          <div className="flex flex-col gap-0.5">
                            <Input
                              type="number"
                              min={0}
                              value={set.reps || ""}
                              onChange={(e) =>
                                updateSetValues(
                                  item.id,
                                  setIdx,
                                  "reps",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className="bg-secondary/40 border-border/60 h-8 text-center font-bold text-xs rounded-md px-1"
                            />
                          </div>

                          {/* Checkmark Button */}
                          <button
                            type="button"
                            onClick={() => toggleSetComplete(item.id, setIdx)}
                            className={`h-8 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-all ${set.completed
                              ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                              : "bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60"
                              }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{set.completed ? "Done" : "Log"}</span>
                          </button>

                          {/* Delete Set */}
                          <button
                            type="button"
                            onClick={() =>
                              removeSetFromExercise(item.id, setIdx)
                            }
                            disabled={item.sets.length <= 1}
                            className="p-1 flex items-center justify-center text-muted-foreground/40 hover:text-destructive transition-colors disabled:opacity-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Bar for Exercise: Add Set & Mini Volume */}
                    <div className="pt-1.5 flex items-center justify-between text-[11px] border-t border-border/30">
                      <button
                        type="button"
                        onClick={() => addSetToExercise(item.id)}
                        className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 py-1"
                      >
                        <Plus className="w-3 h-3" /> Add Set
                      </button>

                      <span className="text-[10px] text-muted-foreground font-mono">
                        Vol:{" "}
                        {item.sets
                          .reduce((sum, s) => sum + s.reps * s.weight, 0)
                          .toLocaleString()}{" "}
                        {unit}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={() => setPickerOpen(true)}
                variant="outline"
                className="flex-1 h-12 py-3 border-blue-500/30 text-blue-400 hover:bg-blue-600/10 font-semibold text-xs sm:text-sm rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Exercise
              </Button>

              <Button
                onClick={finishSession}
                className="flex-1 h-12 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md"
              >
                <Check className="w-4 h-4 mr-1.5" /> Finish Workout ({formatSessionTime(sessionElapsedSeconds)})
              </Button>

              <Button
                onClick={() => setCancelConfirmOpen(true)}
                variant="outline"
                className="h-12 py-3 border-destructive/40 text-destructive hover:bg-destructive/10 font-semibold text-xs sm:text-sm rounded-xl"
              >
                <Ban className="w-4 h-4 mr-1.5" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Scrolling Rest Timer Picker Modal */}
        {activePickerExercise && (
          <ScrollingTimerPicker
            isOpen={!!timerPickerExerciseId}
            onClose={() => setTimerPickerExerciseId(null)}
            currentSeconds={activePickerExercise.restTimerSeconds}
            exerciseName={activePickerExercise.exercise.name}
            onSelect={(sec) =>
              updateExerciseRestTimer(activePickerExercise.id, sec)
            }
          />
        )}

        {/* ── Cancel Workout AlertDialog ─────────────────── */}
        <AlertDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-destructive" />
                Cancel Workout?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will discard all logged sets from your current session.
                Your workout history won&apos;t be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Going</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  ctxCancelSession();
                  setCancelConfirmOpen(false);
                }}
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                Yes, Cancel Workout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Empty Workout Guard Modal ─────────────────── */}
        <Dialog open={emptySessionAlertOpen} onOpenChange={setEmptySessionAlertOpen}>
          <DialogContent className="max-w-xs sm:max-w-sm p-6 text-center" showCloseButton={true}>
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <DialogTitle className="text-base font-semibold text-foreground">
                No Exercises Logged
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground text-center">
                You have not logged any exercises yet
              </DialogDescription>
              <Button
                type="button"
                onClick={() => setEmptySessionAlertOpen(false)}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4 rounded-lg font-medium"
              >
                Continue Workout
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Active Session Date & Time Modal */}
        {activeDateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
            <div className="relative w-full max-w-sm bg-card border border-border/80 rounded-2xl shadow-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-foreground">
                    Adjust Session Date & Time
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDateModalOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground block">
                  Workout Date & Time:
                </label>
                <Input
                  type="datetime-local"
                  value={activeDateInputValue}
                  onChange={(e) => setActiveDateInputValue(e.target.value)}
                  className="bg-secondary/40 border-border/60 h-10 text-sm font-mono text-foreground"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveDateInputValue(toLocalDatetimeInput())}
                  className="px-2 py-1 rounded bg-secondary/80 hover:bg-secondary text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Set to Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setActiveDateInputValue(toLocalDatetimeInput(yesterday));
                  }}
                  className="px-2 py-1 rounded bg-secondary/80 hover:bg-secondary text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Yesterday
                </button>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveDateModalOpen(false)}
                  className="flex-1 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveActiveDate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Compact Exercise Picker Modal */}
        {pickerOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
            <div
              className="fixed inset-0"
              onClick={() => setPickerOpen(false)}
            />
            <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col border border-border/80 bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden">
              <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-secondary/20">
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Select Exercise
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Target your primary & secondary muscle groups
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => setPickerOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-3 space-y-2 border-b border-border/40">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search exercise or muscle..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="pl-8 h-9 bg-secondary/40 border-border/60 text-xs rounded-lg"
                  />
                </div>

                {/* Muscle pills */}
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto scrollbar-none">
                  <Badge
                    variant="secondary"
                    className={`cursor-pointer text-[10px] py-0.5 px-2 ${!pickerMuscle
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    onClick={() => setPickerMuscle("")}
                  >
                    All
                  </Badge>
                  {muscleGroups.map((m) => {
                    const colors = muscleGroupColors[m];
                    const isSelected = pickerMuscle === m;
                    return (
                      <Badge
                        key={m}
                        variant="secondary"
                        className={`cursor-pointer text-[10px] py-0.5 px-2 ${isSelected
                          ? `${colors.bg} ${colors.text}`
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        onClick={() =>
                          setPickerMuscle(isSelected ? "" : m)
                        }
                      >
                        {m}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-border/20">
                {filteredPickerExercises.map((ex) => {
                  const pColors = muscleGroupColors[ex.primaryMuscle];
                  const sColors = muscleGroupColors[ex.secondaryMuscle];
                  return (
                    <button
                      key={ex.id}
                      onClick={() => addExerciseToSession(ex)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-secondary/70 text-left transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Dumbbell className="w-4 h-4 text-muted-foreground group-hover:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs group-hover:text-blue-400 transition-colors">
                            {ex.name}
                          </div>
                          <div className="flex gap-1.5 mt-0.5 text-[10px]">
                            <span className={pColors.text}>
                              Main: {ex.primaryMuscle}
                            </span>
                            <span className="text-muted-foreground">
                              • Sec: {ex.secondaryMuscle}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        + Add
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: Pre-Session Landing View (Start a Session + Session History)
  // ----------------------------------------------------
  return (
    <div className="space-y-6 max-w-2xl mx-auto py-2 px-1 sm:px-0">
      {/* Header Banner — Compact */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600/15 via-cyan-600/10 to-indigo-600/15 border border-blue-500/20 px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Flame className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-tight">
                Workout Logger
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
                Plan exercises, log sets &amp; reps, track rest timers.
              </p>
            </div>
          </div>
          <Button
            onClick={() => startNewSession([])}
            size="sm"
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 rounded-lg shrink-0"
          >
            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
            Start Session
          </Button>
        </div>
      </div>

      {/* ── My Routines ──────────────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-foreground">My Routines</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono font-bold">
              {savedRoutines.length}
            </span>
          </div>
          <button
            type="button"
            onClick={openNewRoutineBuilder}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-[11px] font-semibold transition-all"
          >
            <Plus className="w-3 h-3" /> New Routine
          </button>
        </div>

        {savedRoutines.length === 0 ? (
          <div
            onClick={openNewRoutineBuilder}
            className="cursor-pointer rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all p-5 text-center space-y-1.5 group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xs font-semibold text-foreground">Create your first routine</p>
            <p className="text-[11px] text-muted-foreground">
              Name it, pick exercises, and launch it in one tap anytime.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {savedRoutines.map((routine) => {
              const exNames = routine.exerciseIds
                .map((id) => exercises.find((e) => e.id === id)?.name)
                .filter(Boolean);
              return (
                <div
                  key={routine.id}
                  className="rounded-xl border border-border/70 bg-card hover:border-purple-500/30 transition-all p-3 group flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="text-xs font-bold text-foreground truncate">{routine.name}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {exNames.length} {exNames.length === 1 ? "exercise" : "exercises"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditRoutineBuilder(routine)}
                        className="p-1 rounded text-muted-foreground/50 hover:text-blue-400 transition-colors"
                        title="Edit routine"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteRoutineId(routine.id)}
                        className="p-1 rounded text-muted-foreground/50 hover:text-destructive transition-colors"
                        title="Delete routine"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Exercise name pills */}
                  <div className="flex flex-wrap gap-1">
                    {exNames.slice(0, 4).map((name, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded-md bg-secondary/50 border border-border/40 text-[10px] text-muted-foreground truncate max-w-[120px]"
                      >
                        {name}
                      </span>
                    ))}
                    {exNames.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-secondary/40 border border-border/30 text-[10px] text-muted-foreground">
                        +{exNames.length - 4} more
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => launchRoutine(routine)}
                    className="w-full h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Play className="w-3 h-3 fill-current" /> Launch Routine
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Routine Builder Modal ──────────────────────────── */}
      {routineBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
          <div
            className="fixed inset-0"
            onClick={() => setRoutineBuilderOpen(false)}
          />
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-card border border-border/80 rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border/60 flex items-center justify-between bg-secondary/20">
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {editingRoutine ? "Edit Routine" : "Create Routine"}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Name your routine and add exercises.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRoutineBuilderOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Routine Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Routine Name</label>
                <Input
                  placeholder="e.g. Push Day A, Upper Body..."
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  className="h-9 bg-secondary/40 border-border/60 text-sm"
                />
              </div>

              {/* Selected Exercises */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Exercises
                    {routineExerciseIds.length > 0 && (
                      <span className="ml-1.5 text-[10px] text-purple-400 font-mono">({routineExerciseIds.length})</span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setRoutinePickerSearch(""); setRoutinePickerMuscle(""); setRoutinePickerOpen(true); }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Exercise
                  </button>
                </div>

                {routineExerciseIds.length === 0 ? (
                  <div
                    onClick={() => { setRoutinePickerSearch(""); setRoutinePickerMuscle(""); setRoutinePickerOpen(true); }}
                    className="cursor-pointer rounded-lg border border-dashed border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all p-4 text-center"
                  >
                    <p className="text-[11px] text-muted-foreground">No exercises yet — tap to add</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {routineExerciseIds.map((exId, idx) => {
                      const ex = exercises.find((e) => e.id === exId);
                      if (!ex) return null;
                      const pColors = muscleGroupColors[ex.primaryMuscle];
                      return (
                        <div
                          key={exId}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/30 border border-border/40"
                        >
                          <span className="text-[10px] font-mono text-muted-foreground w-4 text-center shrink-0">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate">{ex.name}</div>
                            <span className={`text-[9px] font-semibold ${pColors.text}`}>{ex.primaryMuscle}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRoutineExerciseIds((prev) => prev.filter((id) => id !== exId))}
                            className="p-1 rounded text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/60 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoutineBuilderOpen(false)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveRoutine}
                disabled={!routineName.trim() || routineExerciseIds.length === 0}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold disabled:opacity-40"
              >
                {editingRoutine ? "Save Changes" : "Save Routine"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Exercise Picker for Routine Builder ───────────── */}
      {routinePickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
          <div className="fixed inset-0" onClick={() => setRoutinePickerOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[80vh] flex flex-col border border-border/80 bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden">
            <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-secondary/20">
              <div>
                <h3 className="font-bold text-sm">Add to Routine</h3>
                <p className="text-[11px] text-muted-foreground">Select exercises to include</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRoutinePickerOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-3 space-y-2 border-b border-border/40">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search exercise or muscle..."
                  value={routinePickerSearch}
                  onChange={(e) => setRoutinePickerSearch(e.target.value)}
                  className="pl-8 h-9 bg-secondary/40 border-border/60 text-xs rounded-lg"
                />
              </div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto scrollbar-none">
                <Badge
                  variant="secondary"
                  className={`cursor-pointer text-[10px] py-0.5 px-2 ${!routinePickerMuscle ? "bg-purple-500/20 text-purple-400" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  onClick={() => setRoutinePickerMuscle("")}
                >
                  All
                </Badge>
                {muscleGroups.map((m) => {
                  const colors = muscleGroupColors[m];
                  const isSelected = routinePickerMuscle === m;
                  return (
                    <Badge
                      key={m}
                      variant="secondary"
                      className={`cursor-pointer text-[10px] py-0.5 px-2 ${isSelected ? `${colors.bg} ${colors.text}` : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      onClick={() => setRoutinePickerMuscle(isSelected ? "" : m)}
                    >
                      {m}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredRoutinePickerExercises.map((ex) => {
                const pColors = muscleGroupColors[ex.primaryMuscle];
                const isAdded = routineExerciseIds.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => {
                      if (isAdded) {
                        setRoutineExerciseIds((prev) => prev.filter((id) => id !== ex.id));
                      } else {
                        setRoutineExerciseIds((prev) => [...prev, ex.id]);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all group ${isAdded ? "bg-purple-500/15 border border-purple-500/30" : "hover:bg-secondary/70 border border-transparent"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isAdded ? "bg-purple-500/20" : "bg-secondary"
                        }`}>
                        {isAdded ? (
                          <Check className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className={`font-semibold text-xs ${isAdded ? "text-purple-300" : "group-hover:text-blue-400"} transition-colors`}>{ex.name}</div>
                        <div className={`text-[10px] ${pColors.text}`}>{ex.primaryMuscle}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold ${isAdded ? "text-purple-400" : "text-blue-400 opacity-0 group-hover:opacity-100"} transition-opacity`}>
                      {isAdded ? "✓ Added" : "+ Add"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-border/60">
              <Button
                size="sm"
                onClick={() => setRoutinePickerOpen(false)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
              >
                Done ({routineExerciseIds.length} selected)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Routine Confirmation Modal ─────────────── */}
      {deleteRoutineId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
          <div className="relative w-full max-w-sm bg-card border border-destructive/40 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Delete Routine?</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {savedRoutines.find((r) => r.id === deleteRoutineId)?.name}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This will permanently remove the routine. Your logged workout history won't be affected.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteRoutineId(null)} className="flex-1 text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={confirmDeleteRoutine} className="flex-1 bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Interactive Workout Calendar ──────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-foreground">Workout Calendar</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold">
              {sessions.length}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">Click a date to view sessions</span>
        </div>

        {/* Calendar with workout day indicators */}
        <WorkoutCalendar
          sessions={sessions}
          onEditDate={openEditSessionDateModal}
          onDeleteRequest={setDeleteConfirmSession}
        />
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL: Edit Saved Session Date & Time */}
      {/* ---------------------------------------------------- */}
      {editSessionModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
          <div className="relative w-full max-w-sm bg-card border border-border/80 rounded-2xl shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm text-foreground">
                  Adjust Session Date & Time
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditSessionModalData(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground block">
                Select Date & Time for this Session:
              </label>
              <Input
                type="datetime-local"
                value={editSessionDateInput}
                onChange={(e) => setEditSessionDateInput(e.target.value)}
                className="bg-secondary/40 border-border/60 h-10 text-sm font-mono text-foreground"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setEditSessionDateInput(toLocalDatetimeInput())}
                className="px-2 py-1 rounded bg-secondary/80 hover:bg-secondary text-[10px] text-muted-foreground hover:text-foreground"
              >
                Set to Now
              </button>
              <button
                type="button"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setEditSessionDateInput(toLocalDatetimeInput(yesterday));
                }}
                className="px-2 py-1 rounded bg-secondary/80 hover:bg-secondary text-[10px] text-muted-foreground hover:text-foreground"
              >
                Yesterday
              </button>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditSessionModalData(null)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveEditedSessionDate}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Save Date & Time
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: Delete Session Confirmation */}
      {/* ---------------------------------------------------- */}
      {deleteConfirmSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
          <div className="relative w-full max-w-sm bg-card border border-destructive/40 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  Delete Workout Session?
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatSessionDateTime(deleteConfirmSession.date)}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this session? This will permanently remove{" "}
              <strong className="text-foreground">
                {deleteConfirmSession.logs.length} exercise logs
              </strong>{" "}
              from your history and progressive overload charts.
            </p>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmSession(null)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteSessionConfirm}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold"
              >
                Delete Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LogWorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-muted-foreground">
          Loading workout session manager...
        </div>
      }
    >
      <WorkoutSessionManager />
    </Suspense>
  );
}
