"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { exercises, muscleGroups, muscleGroupColors } from "@/lib/exercises";
import { useWorkouts } from "@/hooks/use-workouts";
import { useSession } from "@/contexts/session-context";
import { useWorkoutContext } from "@/context/workout-context";
import { Exercise, WorkoutLog, WorkoutSession } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
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
import { SessionDetailDialog } from "@/components/dashboard/session-detail-dialog";
import { SessionHeader } from "@/components/log/session-header";
import { SetRowInput } from "@/components/log/set-row-input";
import { RoutineSelector, type SavedRoutine } from "@/components/log/routine-selector";
import { WorkoutCalendar } from "@/components/log/workout-calendar";
import {
  Play,
  Check,
  Plus,
  Trash2,
  Timer,
  Dumbbell,
  CheckCircle2,
  Search,
  X,
  Flame,
  Award,
  TrendingUp,
  Calendar as CalendarIcon,
  AlertTriangle,
  Ban,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatSessionTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const p = (n: number) => n.toString().padStart(2, "0");
  return hrs > 0 ? `${p(hrs)}:${p(mins)}:${p(secs)}` : `${p(mins)}:${p(secs)}`;
}

// ─── Routine localStorage helpers ─────────────────────────────────────────────

const ROUTINES_KEY = "muscle_lab_custom_routines";

function loadRoutines(): SavedRoutine[] {
  try {
    const raw = localStorage.getItem(ROUTINES_KEY);
    // Also check legacy key for backwards-compat
    if (!raw) {
      const legacy = localStorage.getItem("hypertrophy_custom_routines");
      if (legacy) {
        const parsed = JSON.parse(legacy) as SavedRoutine[];
        localStorage.setItem(ROUTINES_KEY, JSON.stringify(parsed));
        return parsed;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveRoutinesToStorage(routines: SavedRoutine[]) {
  try {
    localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  } catch {}
}

// ─── WorkoutSessionManager ────────────────────────────────────────────────────
// Orchestrates state and delegates rendering to single-responsibility sub-components.

function WorkoutSessionManager() {
  const searchParams = useSearchParams();
  const preselectedExerciseId = searchParams.get("exercise");

  const {
    addSession,
    sessions,
    updateSession,
    deleteSession,
    updateSessionDateTime,
    globalUnit,
  } = useWorkouts();

  const {
    isActive: sessionActive,
    elapsedSeconds: sessionElapsedSeconds,
    sessionDate,
    unit,
    startSession: ctxStartSession,
    cancelSession: ctxCancelSession,
    setSessionDate,
    setExercises: setSessionExercises,
  } = useSession();

  const {
    sessionExercises,
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
  } = useWorkoutContext();

  // ── Custom Routines ────────────────────────────────────────────────────────
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>([]);
  const [routineBuilderOpen, setRoutineBuilderOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<SavedRoutine | null>(null);
  const [routineName, setRoutineName] = useState("");
  const [routineExerciseIds, setRoutineExerciseIds] = useState<string[]>([]);
  const [routinePickerOpen, setRoutinePickerOpen] = useState(false);
  const [routinePickerSearch, setRoutinePickerSearch] = useState("");
  const [routinePickerMuscle, setRoutinePickerMuscle] = useState("");
  const [deleteRoutineId, setDeleteRoutineId] = useState<string | null>(null);

  // ── Exercise picker modal ──────────────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerMuscle, setPickerMuscle] = useState("");

  const filteredPickerExercises = useMemo(
    () =>
      exercises.filter((e) => {
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
      }),
    [pickerSearch, pickerMuscle]
  );

  // ── Session completion summary ─────────────────────────────────────────────
  const [finishedSummary, setFinishedSummary] = useState<{
    durationText: string;
    durationSeconds: number;
    totalSets: number;
    totalVolume: number;
    sessionDate: string;
    exerciseCount: number;
    exercisesSummary: { name: string; setsCount: number; maxWeight: number }[];
  } | null>(null);

  // ── Session lifecycle ──────────────────────────────────────────────────────
  const startNewSession = (initialExercises: Exercise[] = []) => {
    setFinishedSummary(null);
    if (initialExercises.length > 0) {
      ctxStartSession(initialExercises);
      // Override default sets using last-entry history via WorkoutContext
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

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setTimeout(() => {
      setSavedRoutines(loadRoutines());
    }, 0);
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
      persistRoutines(
        savedRoutines.map((r) =>
          r.id === editingRoutine.id
            ? { ...r, name: routineName.trim(), exerciseIds: routineExerciseIds }
            : r
        )
      );
    } else {
      persistRoutines([
        ...savedRoutines,
        {
          id: crypto.randomUUID(),
          name: routineName.trim(),
          exerciseIds: routineExerciseIds,
        },
      ]);
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
      .filter(Boolean) as Exercise[];
    startNewSession(exs);
  };

  // Muscle group mismatch for routine builder
  const addExerciseToRoutine = (exercise: Exercise) => {
    if (routineExerciseIds.length > 0) {
      const firstEx = exercises.find((e) => e.id === routineExerciseIds[0]);
      if (firstEx && exercise.primaryMuscle !== firstEx.primaryMuscle) {
        setPendingExercise(exercise);
        setMismatchContext("routine");
        setMismatchDialogOpen(true);
        return;
      }
    }
    setRoutineExerciseIds((prev) => [...prev, exercise.id]);
  };

  const filteredRoutinePickerExercises = useMemo(
    () =>
      exercises.filter((e) => {
        const matchSearch =
          !routinePickerSearch ||
          e.name.toLowerCase().includes(routinePickerSearch.toLowerCase()) ||
          e.primaryMuscle.toLowerCase().includes(routinePickerSearch.toLowerCase());
        const matchMuscle =
          !routinePickerMuscle ||
          e.primaryMuscle === routinePickerMuscle ||
          e.secondaryMuscle === routinePickerMuscle;
        return matchSearch && matchMuscle;
      }),
    [routinePickerSearch, routinePickerMuscle]
  );

  // ── Rest timer picker ──────────────────────────────────────────────────────
  const [timerPickerExerciseId, setTimerPickerExerciseId] = useState<string | null>(null);
  const activePickerExercise = sessionExercises.find((e) => e.id === timerPickerExerciseId);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [activeDateModalOpen, setActiveDateModalOpen] = useState(false);
  const [activeDateInputValue, setActiveDateInputValue] = useState("");
  const [editSessionModalData, setEditSessionModalData] = useState<{
    sessionId: string;
    currentIso: string;
  } | null>(null);
  const [editSessionDateInput, setEditSessionDateInput] = useState("");
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<WorkoutSession | null>(null);
  const [selectedSessionIdForModal, setSelectedSessionIdForModal] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [emptySessionAlertOpen, setEmptySessionAlertOpen] = useState(false);
  const [invalidSetAlertOpen, setInvalidSetAlertOpen] = useState(false);
  const [mismatchDialogOpen, setMismatchDialogOpen] = useState(false);
  const [pendingExercise, setPendingExercise] = useState<Exercise | null>(null);
  const [mismatchContext, setMismatchContext] = useState<"session" | "routine">("session");

  // Pre-load exercise from URL ?exercise=
  useEffect(() => {
    if (preselectedExerciseId && !sessionActive) {
      const ex = exercises.find((e) => e.id === preselectedExerciseId);
      if (ex) {
        setTimeout(() => {
          startNewSession([ex]);
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedExerciseId]);

  // ── Session finish ─────────────────────────────────────────────────────────

  const isValidCompletedSet = (s: {
    completed?: boolean;
    isDone?: boolean;
    isCompleted?: boolean;
    weight: number;
    reps: number;
  }) => {
    const isDone = Boolean(s.completed || s.isDone || s.isCompleted);
    const weight = Number(s.weight);
    const reps = Number(s.reps);
    return isDone && !isNaN(weight) && weight > 0 && !isNaN(reps) && reps > 0;
  };

  const finishSession = () => {
    const totalValidSetsAcrossAll = sessionExercises.reduce(
      (sum, item) => sum + item.sets.filter(isValidCompletedSet).length,
      0
    );
    if (totalValidSetsAcrossAll === 0) {
      setEmptySessionAlertOpen(true);
      return;
    }

    const sessionId = crypto.randomUUID();
    const completedLogs: WorkoutLog[] = [];
    let totalCompletedSets = 0;
    let totalVolumeLifted = 0;
    const summaryList: { name: string; setsCount: number; maxWeight: number }[] = [];
    const finalSessionDateISO = sessionDate || new Date().toISOString();

    sessionExercises.forEach((item) => {
      const validSets = item.sets.filter(isValidCompletedSet);
      if (validSets.length > 0) {
        const log: WorkoutLog = {
          id: crypto.randomUUID(),
          sessionId,
          date: finalSessionDateISO,
          exerciseId: item.exercise.id,
          exerciseName: item.exercise.name,
          sets: validSets.map((s, idx) => ({
            setNumber: idx + 1,
            reps: Number(s.reps),
            weight: Number(s.weight),
            unit,
          })),
          unit,
        };
        completedLogs.push(log);
        totalCompletedSets += validSets.length;
        totalVolumeLifted += validSets.reduce(
          (sum, s) => sum + Number(s.reps) * Number(s.weight),
          0
        );
        summaryList.push({
          name: item.exercise.name,
          setsCount: validSets.length,
          maxWeight: Math.max(...validSets.map((s) => Number(s.weight))),
        });
      }
    });

    if (completedLogs.length > 0) {
      addSession({
        id: sessionId,
        date: finalSessionDateISO,
        durationSeconds: sessionElapsedSeconds,
        logs: completedLogs,
      });
    }

    setFinishedSummary({
      durationText: formatSessionTime(sessionElapsedSeconds),
      durationSeconds: sessionElapsedSeconds,
      totalSets: totalCompletedSets,
      totalVolume: totalVolumeLifted,
      sessionDate: finalSessionDateISO,
      exerciseCount: completedLogs.length,
      exercisesSummary: summaryList,
    });

    ctxCancelSession();
  };

  // ── Mismatch dialog handlers ───────────────────────────────────────────────

  const handleMismatchInclude = () => {
    if (!pendingExercise) return;
    if (mismatchContext === "session") {
      commitAddExerciseToSession(pendingExercise);
      setPickerOpen(false);
      setPickerSearch("");
      setPickerMuscle("");
    } else {
      setRoutineExerciseIds((prev) => [...prev, pendingExercise.id]);
    }
    setPendingExercise(null);
    setMismatchDialogOpen(false);
  };

  const handleMismatchCancel = () => {
    setPendingExercise(null);
    setMismatchDialogOpen(false);
  };

  // ── Date modal handlers ────────────────────────────────────────────────────

  const openActiveDateModal = () => {
    setActiveDateInputValue(toLocalDatetimeInput(sessionDate));
    setActiveDateModalOpen(true);
  };

  const saveActiveDate = () => {
    if (activeDateInputValue) {
      const parsed = new Date(activeDateInputValue);
      if (!isNaN(parsed.getTime())) setSessionDate(parsed.toISOString());
    }
    setActiveDateModalOpen(false);
  };

  const openEditSessionDateModal = (session: WorkoutSession) => {
    setEditSessionModalData({ sessionId: session.id, currentIso: session.date });
    setEditSessionDateInput(toLocalDatetimeInput(session.date));
  };

  const saveEditedSessionDate = () => {
    if (editSessionModalData && editSessionDateInput) {
      const parsed = new Date(editSessionDateInput);
      if (!isNaN(parsed.getTime()))
        updateSessionDateTime(editSessionModalData.sessionId, parsed.toISOString());
    }
    setEditSessionModalData(null);
  };

  // ── Handle add exercise to session (with mismatch hook) ───────────────────

  const handlePickExerciseForSession = (exercise: Exercise) => {
    addExerciseToSession(exercise, (ex) => {
      setPendingExercise(ex);
      setMismatchContext("session");
      setMismatchDialogOpen(true);
    });
    if (!mismatchDialogOpen) {
      setPickerOpen(false);
      setPickerSearch("");
      setPickerMuscle("");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Session Finished Summary
  // ─────────────────────────────────────────────────────────────────────────
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
            Progressive overload recorded for your progress charts.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/40">
            {[
              {
                label: "Duration",
                value: finishedSummary.durationText,
                color: "text-blue-400",
              },
              {
                label: "Sets Done",
                value: finishedSummary.totalSets,
                color: "text-foreground",
              },
              {
                label: "Volume",
                value: `${finishedSummary.totalVolume.toLocaleString()} ${globalUnit}`,
                color: "text-cyan-400",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-card/80 p-2.5 rounded-xl border border-border/50"
              >
                <div className="text-[10px] text-muted-foreground">{label}</div>
                <div className={`text-base font-bold font-mono ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>

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

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Active Session Workspace
  // ─────────────────────────────────────────────────────────────────────────
  if (sessionActive) {
    return (
      <div className="space-y-3.5 max-w-3xl mx-auto pb-24 px-1 sm:px-0">
        {/* Session control bar — sub-component */}
        <SessionHeader
          elapsedSeconds={sessionElapsedSeconds}
          onOpenDateModal={openActiveDateModal}
          onCancelClick={() => setCancelConfirmOpen(true)}
          onFinishClick={finishSession}
        />

        {/* Exercise list */}
        {sessionExercises.length === 0 ? (
          <Card className="border-border/60 bg-card border-dashed">
            <CardContent className="py-12 text-center space-y-2.5">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto text-blue-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold">Your session is empty</h2>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Add exercises for today and pre-set your weights and reps.
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
              const primaryColors = muscleGroupColors[item.exercise.primaryMuscle];

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden transition-all"
                >
                  {/* Exercise card header */}
                  <div className="px-3 py-2.5 border-b border-border/40 bg-secondary/20 flex items-center justify-between gap-2">
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

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.timerActive && (
                        <ExerciseInlineTimer
                          key={`${item.id}-${item.timerKey}`}
                          durationSeconds={item.restTimerSeconds}
                          isActive={item.timerActive}
                          exerciseName={item.exercise.name}
                          onDismiss={() => dismissExerciseTimer(item.id)}
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => setTimerPickerExerciseId(item.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/80 hover:bg-secondary border border-border/60 hover:border-blue-500/40 text-[11px] font-medium text-foreground transition-all"
                        title="Customize rest timer"
                      >
                        <Timer className="w-3 h-3 text-blue-400" />
                        <span className="font-mono font-semibold">
                          {formatIntervalLabel(item.restTimerSeconds)}
                        </span>
                      </button>

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

                  {/* Sets table */}
                  <div className="p-2.5 sm:p-3 space-y-1.5">
                    <div className="grid grid-cols-[26px_1fr_1fr_64px_24px] gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-1">
                      <span>Set</span>
                      <span className="text-center">{unit}</span>
                      <span className="text-center">Reps</span>
                      <span className="text-center">Done</span>
                      <span />
                    </div>

                    <div
                      className="space-y-1"
                      role="table"
                      aria-label={`Sets for ${item.exercise.name}`}
                    >
                      {item.sets.map((set, setIdx) => (
                        <SetRowInput
                          key={setIdx}
                          set={set}
                          setIndex={setIdx}
                          unit={unit}
                          isOnlySet={item.sets.length <= 1}
                          onWeightChange={(v) => updateSetValues(item.id, setIdx, "weight", v)}
                          onRepsChange={(v) => updateSetValues(item.id, setIdx, "reps", v)}
                          onToggleComplete={() =>
                            toggleSetComplete(item.id, setIdx, () =>
                              setInvalidSetAlertOpen(true)
                            )
                          }
                          onRemove={() => removeSetFromExercise(item.id, setIdx)}
                        />
                      ))}
                    </div>

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

            {/* Bottom action row */}
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
                <Check className="w-4 h-4 mr-1.5" /> Finish Workout (
                {formatSessionTime(sessionElapsedSeconds)})
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

        {/* Rest timer picker */}
        {activePickerExercise && (
          <ScrollingTimerPicker
            isOpen={!!timerPickerExerciseId}
            onClose={() => setTimerPickerExerciseId(null)}
            currentSeconds={activePickerExercise.restTimerSeconds}
            exerciseName={activePickerExercise.exercise.name}
            onSelect={(sec) => updateExerciseRestTimer(activePickerExercise.id, sec)}
          />
        )}

        {/* Cancel workout dialog */}
        <AlertDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-destructive" /> Cancel Workout?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will discard all logged sets from your current session. Your workout
                history won&apos;t be affected.
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

        {/* Empty session guard */}
        <Dialog open={emptySessionAlertOpen} onOpenChange={setEmptySessionAlertOpen}>
          <DialogContent className="max-w-xs sm:max-w-sm p-6 text-center" showCloseButton={true}>
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <DialogTitle className="text-base font-semibold">No Exercises Logged</DialogTitle>
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

        {/* Incomplete set validation */}
        <Dialog open={invalidSetAlertOpen} onOpenChange={setInvalidSetAlertOpen}>
          <DialogContent className="max-w-xs sm:max-w-sm p-6 text-center" showCloseButton={true}>
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <DialogTitle className="text-base font-semibold">Incomplete Set</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground text-center">
                Please input load and reps before marking as done.
              </DialogDescription>
              <Button
                type="button"
                onClick={() => setInvalidSetAlertOpen(false)}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4 rounded-lg font-medium"
              >
                Got it
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Muscle group mismatch */}
        <AlertDialog
          open={mismatchDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleMismatchCancel();
          }}
        >
          <AlertDialogContent className="max-w-sm" style={{ zIndex: 9999 }}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Mixed Muscle Groups
              </AlertDialogTitle>
              <AlertDialogDescription>
                These are two different muscle groups. Are you sure you want to include them
                together in your routine?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleMismatchCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleMismatchInclude}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Include
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Active session date modal */}
        {activeDateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
            <div className="relative w-full max-w-sm bg-card border border-border/80 rounded-2xl shadow-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-foreground">
                    Adjust Session Date &amp; Time
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
                  Workout Date &amp; Time:
                </label>
                <Input
                  type="datetime-local"
                  value={activeDateInputValue}
                  onChange={(e) => setActiveDateInputValue(e.target.value)}
                  className="bg-secondary/40 border-border/60 h-10 text-sm font-mono text-foreground"
                />
              </div>
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
                    const y = new Date();
                    y.setDate(y.getDate() - 1);
                    setActiveDateInputValue(toLocalDatetimeInput(y));
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

        {/* Exercise picker modal */}
        {pickerOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
            <div className="fixed inset-0" onClick={() => setPickerOpen(false)} />
            <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col border border-border/80 bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden">
              <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-secondary/20">
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Select Exercise</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Target your primary &amp; secondary muscle groups
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
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search exercise or muscle..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="pl-8 h-9 bg-secondary/40 border-border/60 text-xs rounded-lg"
                  />
                </div>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto scrollbar-none">
                  <Badge
                    variant="secondary"
                    className={`cursor-pointer text-[10px] py-0.5 px-2 ${
                      !pickerMuscle
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
                        className={`cursor-pointer text-[10px] py-0.5 px-2 ${
                          isSelected
                            ? `${colors.bg} ${colors.text}`
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setPickerMuscle(isSelected ? "" : m)}
                      >
                        {m}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-border/20">
                {filteredPickerExercises.map((ex) => {
                  const pColors = muscleGroupColors[ex.primaryMuscle];
                  return (
                    <button
                      key={ex.id}
                      onClick={() => handlePickExerciseForSession(ex)}
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
                            <span className={pColors.text}>Main: {ex.primaryMuscle}</span>
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

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Pre-Session Landing (Start + Routines & Templates + Calendar)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl mx-auto py-2 px-1 sm:px-0">
      {/* Header banner */}
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
            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Start Session
          </Button>
        </div>
      </div>

      {/* Routine Selector — extracted sub-component */}
      <RoutineSelector
        routines={savedRoutines}
        onNewRoutine={openNewRoutineBuilder}
        onEditRoutine={openEditRoutineBuilder}
        onDeleteRoutine={setDeleteRoutineId}
        onLaunchRoutine={launchRoutine}
      />

      {/* Routine Builder Modal */}
      {routineBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
          <div className="fixed inset-0" onClick={() => setRoutineBuilderOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-card border border-border/80 rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden">
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

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Routine Name</label>
                <Input
                  placeholder="e.g. Push Day A, Upper Body..."
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  className="h-9 bg-secondary/40 border-border/60 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Exercises{" "}
                    {routineExerciseIds.length > 0 && (
                      <span className="ml-1.5 text-[10px] text-purple-400 font-mono">
                        ({routineExerciseIds.length})
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRoutinePickerSearch("");
                      setRoutinePickerMuscle("");
                      setRoutinePickerOpen(true);
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Exercise
                  </button>
                </div>

                {routineExerciseIds.length === 0 ? (
                  <div
                    onClick={() => {
                      setRoutinePickerSearch("");
                      setRoutinePickerMuscle("");
                      setRoutinePickerOpen(true);
                    }}
                    className="cursor-pointer rounded-lg border border-dashed border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all p-4 text-center"
                  >
                    <p className="text-[11px] text-muted-foreground">
                      No exercises yet — tap to add
                    </p>
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
                          <span className="text-[10px] font-mono text-muted-foreground w-4 text-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate">{ex.name}</div>
                            <span className={`text-[9px] font-semibold ${pColors.text}`}>
                              {ex.primaryMuscle}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setRoutineExerciseIds((prev) =>
                                prev.filter((id) => id !== exId)
                              )
                            }
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

      {/* Routine exercise picker */}
      {routinePickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
          <div className="fixed inset-0" onClick={() => setRoutinePickerOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[80vh] flex flex-col border border-border/80 bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden">
            <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-secondary/20">
              <div>
                <h3 className="font-bold text-sm">Add to Routine</h3>
                <p className="text-[11px] text-muted-foreground">Select exercises to include</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setRoutinePickerOpen(false)}
              >
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
                  className={`cursor-pointer text-[10px] py-0.5 px-2 ${
                    !routinePickerMuscle
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
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
                      className={`cursor-pointer text-[10px] py-0.5 px-2 ${
                        isSelected
                          ? `${colors.bg} ${colors.text}`
                          : "bg-secondary text-muted-foreground hover:text-foreground"
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
                        addExerciseToRoutine(ex);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all group ${
                      isAdded
                        ? "bg-purple-500/15 border border-purple-500/30"
                        : "hover:bg-secondary/70 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isAdded ? "bg-purple-500/20" : "bg-secondary"
                        }`}
                      >
                        {isAdded ? (
                          <Check className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div
                          className={`font-semibold text-xs ${
                            isAdded ? "text-purple-300" : "group-hover:text-blue-400"
                          } transition-colors`}
                        >
                          {ex.name}
                        </div>
                        <div className={`text-[10px] ${pColors.text}`}>{ex.primaryMuscle}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold ${
                        isAdded
                          ? "text-purple-400"
                          : "text-blue-400 opacity-0 group-hover:opacity-100"
                      } transition-opacity`}
                    >
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

      {/* Delete routine confirm */}
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
              This will permanently remove the routine. Your logged workout history won&apos;t
              be affected.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteRoutineId(null)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmDeleteRoutine}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Workout Calendar — extracted sub-component */}
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
        <WorkoutCalendar
          sessions={sessions}
          onEditDate={openEditSessionDateModal}
          onDeleteRequest={setDeleteConfirmSession}
          onSelectSession={(sessionId) => setSelectedSessionIdForModal(sessionId)}
        />
      </div>

      {/* Edit session date modal */}
      {editSessionModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
          <div className="relative w-full max-w-sm bg-card border border-border/80 rounded-2xl shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm text-foreground">
                  Adjust Session Date &amp; Time
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
                Select Date &amp; Time for this Session:
              </label>
              <Input
                type="datetime-local"
                value={editSessionDateInput}
                onChange={(e) => setEditSessionDateInput(e.target.value)}
                className="bg-secondary/40 border-border/60 h-10 text-sm font-mono text-foreground"
              />
            </div>
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
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  setEditSessionDateInput(toLocalDatetimeInput(y));
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
                Save Date &amp; Time
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete session confirm */}
      {deleteConfirmSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
          <div className="relative w-full max-w-sm bg-card border border-destructive/40 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Delete Workout Session?</h3>
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
              from your history and progress charts.
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
                onClick={() => {
                  deleteSession(deleteConfirmSession.id);
                  setDeleteConfirmSession(null);
                }}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold"
              >
                Delete Session
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Session detail modal */}
      {selectedSessionIdForModal && (
        <SessionDetailDialog
          sessionId={selectedSessionIdForModal}
          onClose={() => setSelectedSessionIdForModal(null)}
          onSave={updateSession}
          onDeleteSession={deleteSession}
        />
      )}

      {/* Muscle group mismatch (pre-session / routine builder) */}
      <AlertDialog
        open={mismatchDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleMismatchCancel();
        }}
      >
        <AlertDialogContent className="max-w-sm" style={{ zIndex: 9999 }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Mixed Muscle Groups
            </AlertDialogTitle>
            <AlertDialogDescription>
              These are two different muscle groups. Are you sure you want to include them
              together in your routine?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleMismatchCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMismatchInclude}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Include
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────
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
