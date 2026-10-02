"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { exercises, muscleGroups, muscleGroupColors } from "@/lib/exercises";
import { useWorkouts } from "@/hooks/use-workouts";
import { Exercise, WorkoutSet, WorkoutLog, WorkoutSession } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  Edit2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface SessionExerciseSet extends WorkoutSet {
  completed: boolean;
}

interface SessionExerciseItem {
  id: string; // unique item id in session
  exercise: Exercise;
  restTimerSeconds: number; // custom rest timer for this exercise (15s - 300s)
  sets: SessionExerciseSet[];
  // Inline timer state for this exercise
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

function WorkoutSessionManager() {
  const searchParams = useSearchParams();
  const preselectedExerciseId = searchParams.get("exercise");

  const {
    addSession,
    workouts,
    sessions,
    deleteSession,
    updateSessionDateTime,
  } = useWorkouts();

  // Session State
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState<number>(0);
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString());
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");

  // Exercises planned in this active session
  const [sessionExercises, setSessionExercises] = useState<SessionExerciseItem[]>([]);

  // Exercise Picker Modal
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

  // Session duration timer loop
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sessionActive && sessionStartTime) {
      timerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        setSessionElapsedSeconds(Math.floor((now - sessionStartTime) / 1000));
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [sessionActive, sessionStartTime]);

  // Pre-load exercise if URL has ?exercise=
  useEffect(() => {
    if (preselectedExerciseId && !sessionActive) {
      const ex = exercises.find((e) => e.id === preselectedExerciseId);
      if (ex) {
        startNewSession([ex]);
      }
    }
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

  const startNewSession = (initialExercises: Exercise[] = []) => {
    const now = Date.now();
    setSessionStartTime(now);
    setSessionElapsedSeconds(0);
    setSessionDate(new Date().toISOString());
    setSessionActive(true);
    setFinishedSummary(null);

    if (initialExercises.length > 0) {
      const items: SessionExerciseItem[] = initialExercises.map((ex) => ({
        id: crypto.randomUUID(),
        exercise: ex,
        restTimerSeconds: 120, // default 2 minutes
        timerActive: false,
        timerKey: 0,
        sets: [
          { setNumber: 1, reps: 8, weight: 60, completed: false },
          { setNumber: 2, reps: 8, weight: 60, completed: false },
          { setNumber: 3, reps: 8, weight: 60, completed: false },
        ],
      }));
      setSessionExercises(items);
    } else {
      setSessionExercises([]);
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
      sets: [
        { setNumber: 1, reps: 8, weight: 60, completed: false },
        { setNumber: 2, reps: 8, weight: 60, completed: false },
        { setNumber: 3, reps: 8, weight: 60, completed: false },
      ],
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
            reps: lastSet ? lastSet.reps : 8,
            weight: lastSet ? lastSet.weight : 60,
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
    if (sessionExercises.length === 0) {
      setSessionActive(false);
      return;
    }

    const sessionId = crypto.randomUUID();
    const completedLogs: WorkoutLog[] = [];
    let totalCompletedSets = 0;
    let totalVolumeLifted = 0;
    const summaryList: { name: string; setsCount: number; maxWeight: number }[] =
      [];

    const finalSessionDateISO = sessionDate || new Date().toISOString();

    sessionExercises.forEach((item) => {
      const finishedSets = item.sets.filter((s) => s.completed);
      const setsToRecord = finishedSets.length > 0 ? finishedSets : item.sets;

      if (setsToRecord.length > 0) {
        const log: WorkoutLog = {
          id: crypto.randomUUID(),
          sessionId: sessionId,
          date: finalSessionDateISO,
          exerciseId: item.exercise.id,
          exerciseName: item.exercise.name,
          sets: setsToRecord.map((s) => ({
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight,
          })),
          unit: unit,
        };

        completedLogs.push(log);
        totalCompletedSets += setsToRecord.length;
        const exVolume = setsToRecord.reduce(
          (sum, s) => sum + s.reps * s.weight,
          0
        );
        totalVolumeLifted += exVolume;
        const maxWt = Math.max(...setsToRecord.map((s) => s.weight));

        summaryList.push({
          name: item.exercise.name,
          setsCount: setsToRecord.length,
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

    setSessionActive(false);
    setSessionExercises([]);
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
            <Calendar className="w-3.5 h-3.5" />
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
                {finishedSummary.totalVolume.toLocaleString()} {unit}
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
                  Top: {ex.maxWeight} {unit}
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
        {/* Compact Sticky Session Bar */}
        <div className="sticky top-16 lg:top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-3.5 sm:px-6 py-2 bg-card/95 backdrop-blur-md border-b border-border/60 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 max-w-3xl mx-auto">
            {/* Live Clock & Date Adjuster */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-bold text-sm">
                <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>{formatSessionTime(sessionElapsedSeconds)}</span>
              </div>

              {/* Adjust Session Date & Time Button */}
              <button
                type="button"
                onClick={openActiveDateModal}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/70 hover:bg-secondary border border-border/50 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                title="Adjust session date & time"
              >
                <Calendar className="w-3 h-3 text-cyan-400" />
                <span className="truncate max-w-[130px] sm:max-w-none">
                  {new Date(sessionDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <Edit2 className="w-2.5 h-2.5 opacity-60 ml-0.5" />
              </button>
            </div>

            {/* Right Controls: Unit & Finish */}
            <div className="flex items-center gap-2">
              <div className="flex bg-secondary rounded-md p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setUnit("kg")}
                  className={`px-2 py-0.5 rounded font-medium transition-all ${
                    unit === "kg"
                      ? "bg-blue-600 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => setUnit("lbs")}
                  className={`px-2 py-0.5 rounded font-medium transition-all ${
                    unit === "lbs"
                      ? "bg-blue-600 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  lbs
                </button>
              </div>

              <Button
                onClick={finishSession}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-7.5 px-3 rounded-lg shadow-sm"
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Finish
              </Button>
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
                <Plus className="w-3.5 h-3.5 mr-1" /> + Add Exercise
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
                          className={`grid grid-cols-[26px_1fr_1fr_64px_24px] gap-1.5 items-center p-1 rounded-lg transition-all ${
                            set.completed
                              ? "bg-green-500/10 border border-green-500/30"
                              : "bg-secondary/20 hover:bg-secondary/40 border border-transparent"
                          }`}
                        >
                          {/* Set number */}
                          <div
                            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold ${
                              set.completed
                                ? "bg-green-500/20 text-green-400"
                                : "text-muted-foreground font-semibold"
                            }`}
                          >
                            {set.setNumber}
                          </div>

                          {/* Weight input */}
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

                          {/* Reps input */}
                          <Input
                            type="number"
                            min={1}
                            value={set.reps || ""}
                            onChange={(e) =>
                              updateSetValues(
                                item.id,
                                setIdx,
                                "reps",
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="8"
                            className="bg-secondary/40 border-border/60 h-8 text-center font-bold text-xs rounded-md px-1"
                          />

                          {/* Checkmark Button */}
                          <button
                            type="button"
                            onClick={() => toggleSetComplete(item.id, setIdx)}
                            className={`h-8 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                              set.completed
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
                className="flex-1 h-11 border-blue-500/30 text-blue-400 hover:bg-blue-600/10 font-semibold text-xs sm:text-sm rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1.5" /> + Add Exercise
              </Button>

              <Button
                onClick={finishSession}
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md"
              >
                <Check className="w-4 h-4 mr-1.5" /> Finish Workout ({formatSessionTime(sessionElapsedSeconds)})
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

        {/* Active Session Date & Time Modal */}
        {activeDateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
            <div className="relative w-full max-w-sm bg-card border border-border/80 rounded-2xl shadow-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
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
      {/* Header Banner (Compact & Clean) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/15 via-cyan-600/10 to-indigo-600/15 border border-blue-500/20 p-5 sm:p-7">
        <div className="flex items-center gap-1.5 mb-1.5 text-blue-400 text-xs font-semibold">
          <Flame className="w-4 h-4 text-blue-400" />
          <span>Hypertrophy Session Mode</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Workout Logger
        </h1>
        <p className="text-muted-foreground mt-1.5 max-w-md leading-relaxed text-xs sm:text-sm">
          Plan multiple exercises, pre-set weights & reps, and track your workout duration with exercise-specific rest countdowns.
        </p>

        {/* Big Start a Session CTA */}
        <div className="pt-4">
          <Button
            onClick={() => startNewSession([])}
            size="lg"
            className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/20 rounded-xl group transition-all duration-200"
          >
            <Play className="w-4 h-4 mr-2.5 fill-current" />
            Start a Session
          </Button>
        </div>
      </div>

      {/* Quick Setup Routines */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Quick Routines
          </h2>
          <span className="text-[11px] text-muted-foreground">
            1-Tap Multi-Exercise
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Push Routine */}
          <div
            onClick={() => {
              const pushExs = exercises.filter((e) =>
                [
                  "flat-barbell-bench-press",
                  "incline-dumbbell-press",
                  "lateral-raises",
                  "tricep-pushdown",
                ].includes(e.id)
              );
              startNewSession(pushExs);
            }}
            className="cursor-pointer rounded-xl border border-border/70 bg-card hover:bg-secondary/40 hover:border-blue-500/40 transition-all p-3 group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Push Day
              </span>
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-xs text-foreground">
              Chest, Shoulders & Triceps
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              4 exercises • Bench, Incline DB, Lateral Raises, Pushdowns
            </p>
          </div>

          {/* Pull Routine */}
          <div
            onClick={() => {
              const pullExs = exercises.filter((e) =>
                [
                  "barbell-row",
                  "lat-pulldown",
                  "face-pulls",
                  "barbell-curl",
                ].includes(e.id)
              );
              startNewSession(pullExs);
            }}
            className="cursor-pointer rounded-xl border border-border/70 bg-card hover:bg-secondary/40 hover:border-cyan-500/40 transition-all p-3 group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                Pull Day
              </span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <h3 className="font-semibold text-xs text-foreground">
              Back, Rear Delts & Biceps
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              4 exercises • Row, Lat Pulldown, Face Pulls, Curls
            </p>
          </div>

          {/* Leg Routine */}
          <div
            onClick={() => {
              const legExs = exercises.filter((e) =>
                [
                  "barbell-squat",
                  "romanian-deadlift",
                  "leg-extension",
                  "standing-calf-raise",
                ].includes(e.id)
              );
              startNewSession(legExs);
            }}
            className="cursor-pointer rounded-xl border border-border/70 bg-card hover:bg-secondary/40 hover:border-green-500/40 transition-all p-3 group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-green-400">
                Leg Day
              </span>
              <Sparkles className="w-3.5 h-3.5 text-green-400" />
            </div>
            <h3 className="font-semibold text-xs text-foreground">
              Quads, Hamstrings & Calves
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              4 exercises • Squats, RDL, Leg Extension, Calves
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* LOGGED WORKOUT SESSIONS (Date & Time + Delete Features) */}
      {/* ---------------------------------------------------- */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-foreground">
              Logged Workout Sessions
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono font-bold">
              {sessions.length}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Adjust date/time or delete
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card p-6 text-center space-y-2">
            <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <div className="text-xs font-semibold text-foreground">
              No sessions logged yet
            </div>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Start a session above. Completed sessions will appear here with full date/time editing and deletion controls.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sessions.map((session) => {
              const totalSetsCount = session.logs.reduce(
                (sum, l) => sum + l.sets.length,
                0
              );
              const totalVol = session.logs.reduce(
                (sum, l) =>
                  sum + l.sets.reduce((sSum, s) => sSum + s.reps * s.weight, 0),
                0
              );
              const unitUsed = session.logs[0]?.unit || "kg";

              return (
                <div
                  key={session.id}
                  className="rounded-xl border border-border/60 bg-card p-3.5 hover:border-border/80 transition-all space-y-2.5 shadow-sm"
                >
                  {/* Top Bar: Date, Time & Actions */}
                  <div className="flex items-start justify-between gap-2 border-b border-border/30 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span>{formatSessionDateTime(session.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                        {session.durationSeconds && session.durationSeconds > 0 ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {formatSessionTime(session.durationSeconds)}
                          </span>
                        ) : null}
                        <span>•</span>
                        <span>{session.logs.length} exercises</span>
                        <span>•</span>
                        <span>{totalSetsCount} sets</span>
                      </div>
                    </div>

                    {/* Action buttons: Edit Date/Time & Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditSessionDateModal(session)}
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Adjust session date & time"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        <span>Date/Time</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmSession(session)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete this session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Exercises Pill Breakdown */}
                  <div className="flex flex-wrap gap-1.5">
                    {session.logs.map((log) => {
                      const maxWt = Math.max(...log.sets.map((s) => s.weight));
                      return (
                        <div
                          key={log.id}
                          className="px-2 py-1 rounded-md bg-secondary/40 border border-border/40 text-[10px] font-medium text-foreground flex items-center gap-1.5"
                        >
                          <span className="font-semibold truncate max-w-[130px] sm:max-w-none">
                            {log.exerciseName}
                          </span>
                          <span className="text-muted-foreground">
                            {log.sets.length} sets
                          </span>
                          <span className="font-mono text-blue-400 font-bold">
                            {maxWt} {log.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Volume */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/20 text-muted-foreground">
                    <span>Total Session Volume:</span>
                    <span className="font-mono font-bold text-foreground">
                      {totalVol.toLocaleString()} {unitUsed}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL: Edit Saved Session Date & Time */}
      {/* ---------------------------------------------------- */}
      {editSessionModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
          <div className="relative w-full max-w-sm bg-card border border-border/80 rounded-2xl shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
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
