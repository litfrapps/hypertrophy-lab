"use client";

import { useState, useMemo, useEffect } from "react";
import { useWorkouts } from "@/hooks/use-workouts";
import { exercises } from "@/lib/exercises";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import Link from "next/link";
import {
  Clock,
  TrendingUp,
  Trash2,
  X,
  Plus,
  Search,
  Check,
  Dumbbell,
} from "lucide-react";
import { WorkoutSession, WorkoutLog, WorkoutSet } from "@/types";

export interface SessionDetailDialogProps {
  sessionId?: string | null;
  session?: WorkoutSession | null;
  onClose: () => void;
  onSave?: (s: WorkoutSession) => Promise<void> | void;
  onDeleteSession?: (sessionId: string) => Promise<void> | void;
}

// ─── Session Details Full Dialog / Modal ───────────────────────────────────────
export function SessionDetailDialog({
  sessionId,
  session: propSession,
  onClose,
  onSave,
  onDeleteSession,
}: SessionDetailDialogProps) {
  const {
    sessions,
    updateSession: defaultUpdateSession,
    deleteSession: defaultDeleteSession,
    globalUnit,
    convertWeight,
  } = useWorkouts();

  // Find active session by sessionId or fallback to propSession
  const activeSession = useMemo(() => {
    const targetId = sessionId || propSession?.id;
    if (targetId) {
      const found = sessions.find((s) => s.id === targetId);
      if (found) return found;
    }
    return propSession ?? null;
  }, [sessionId, propSession, sessions]);

  const [editedLogs, setEditedLogs] = useState<WorkoutLog[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [lastExerciseAlertOpen, setLastExerciseAlertOpen] = useState(false);
  const [deleteSessionAlertOpen, setDeleteSessionAlertOpen] = useState(false);

  useEffect(() => {
    if (activeSession) {
      setTimeout(() => {
        setEditedLogs(
          activeSession.logs.map((l) => ({
            ...l,
            unit: globalUnit,
            sets: l.sets.map((s) => ({
              ...s,
              weight: convertWeight(s.weight, s.unit || l.unit || "kg", globalUnit),
              unit: globalUnit,
            })),
          }))
        );
        setExerciseSearch("");
        setShowExercisePicker(false);
        setLastExerciseAlertOpen(false);
        setDeleteSessionAlertOpen(false);
      }, 0);
    } else {
      setTimeout(() => {
        setEditedLogs([]);
      }, 0);
    }
  }, [activeSession, globalUnit, convertWeight]);

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.toLowerCase();
    return exercises
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.primaryMuscle.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [exerciseSearch]);

  const updateSet = (
    logIdx: number,
    setIdx: number,
    field: "weight" | "reps",
    val: string
  ) => {
    setEditedLogs((prev) =>
      prev.map((l, li) =>
        li !== logIdx
          ? l
          : {
              ...l,
              sets: l.sets.map((s, si) =>
                si !== setIdx ? s : { ...s, [field]: parseFloat(val) || 0 }
              ),
            }
      )
    );
  };

  const addSet = (logIdx: number) => {
    setEditedLogs((prev) =>
      prev.map((l, li) => {
        if (li !== logIdx) return l;
        const last = l.sets[l.sets.length - 1];
        const newSet: WorkoutSet = {
          setNumber: l.sets.length + 1,
          reps: last?.reps ?? 8,
          weight: last?.weight ?? 0,
          unit: globalUnit,
        };
        return { ...l, sets: [...l.sets, newSet] };
      })
    );
  };

  const removeSet = (logIdx: number, setIdx: number) => {
    setEditedLogs((prev) =>
      prev.map((l, li) => {
        if (li !== logIdx || l.sets.length <= 1) return l;
        return {
          ...l,
          sets: l.sets
            .filter((_, si) => si !== setIdx)
            .map((s, i) => ({ ...s, setNumber: i + 1 })),
        };
      })
    );
  };

  const requestDeleteExercise = (logIdx: number) => {
    if (editedLogs.length <= 1) {
      setLastExerciseAlertOpen(true);
      return;
    }
    setEditedLogs((prev) => prev.filter((_, li) => li !== logIdx));
  };

  const handleConfirmDeleteLastExercise = async () => {
    if (activeSession) {
      if (onDeleteSession) {
        await onDeleteSession(activeSession.id);
      } else {
        await defaultDeleteSession(activeSession.id);
      }
    }
    setLastExerciseAlertOpen(false);
    onClose();
  };

  const handleConfirmDeleteSession = async () => {
    if (activeSession) {
      if (onDeleteSession) {
        await onDeleteSession(activeSession.id);
      } else {
        await defaultDeleteSession(activeSession.id);
      }
    }
    setDeleteSessionAlertOpen(false);
    onClose();
  };

  const addExercise = (exerciseId: string) => {
    const ex = exercises.find((e) => e.id === exerciseId);
    if (!ex || !activeSession) return;
    const newLog: WorkoutLog = {
      id: crypto.randomUUID(),
      sessionId: activeSession.id,
      date: activeSession.date,
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: [
        { setNumber: 1, reps: 8, weight: 0, unit: globalUnit },
        { setNumber: 2, reps: 8, weight: 0, unit: globalUnit },
        { setNumber: 3, reps: 8, weight: 0, unit: globalUnit },
      ],
      unit: globalUnit,
    };
    setEditedLogs((prev) => [...prev, newLog]);
    setShowExercisePicker(false);
    setExerciseSearch("");
  };

  const handleSave = async () => {
    if (!activeSession) return;
    const validLogs = editedLogs.filter((l) => l.sets.length > 0);
    if (validLogs.length === 0) {
      if (onDeleteSession) {
        await onDeleteSession(activeSession.id);
      } else {
        await defaultDeleteSession(activeSession.id);
      }
    } else {
      const updated: WorkoutSession = { ...activeSession, logs: validLogs };
      if (onSave) {
        await onSave(updated);
      } else {
        await defaultUpdateSession(updated);
      }
    }
    onClose();
  };

  if (!activeSession) return null;

  const sessionDate = new Date(activeSession.date);
  const isValidDate = !isNaN(sessionDate.getTime());
  const dateFormatted = isValidDate
    ? sessionDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : activeSession.date;
  const timeFormatted = isValidDate
    ? sessionDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const totalSetsCount = editedLogs.reduce((acc, l) => acc + l.sets.length, 0);
  const totalVolume = editedLogs.reduce(
    (acc, l) => acc + l.sets.reduce((sSum, s) => sSum + s.reps * s.weight, 0),
    0
  );
  const durationMins = activeSession.durationSeconds
    ? Math.round(activeSession.durationSeconds / 60)
    : null;

  return (
    <>
      <Dialog open={!!activeSession} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="sm:max-w-2xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden"
          showCloseButton={true}
        >
          <DialogHeader className="p-4 sm:p-5 border-b border-border/50 bg-secondary/15 shrink-0">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center justify-between gap-2">
              <span>Session Details — {dateFormatted}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
              {timeFormatted && <span>{timeFormatted}</span>}
              {timeFormatted && <span>·</span>}
              <span>
                {editedLogs.length}{" "}
                {editedLogs.length === 1 ? "exercise" : "exercises"}
              </span>
              <span>·</span>
              <span>{totalSetsCount} sets</span>
              <span>·</span>
              <span className="font-mono text-foreground font-semibold">
                {Math.round(totalVolume).toLocaleString()} {globalUnit}
              </span>
              {durationMins && durationMins > 0 && (
                <>
                  <span>·</span>
                  <Badge
                    variant="secondary"
                    className="bg-cyan-500/10 text-cyan-400 border-0 text-[10px] px-1.5 py-0 h-4"
                  >
                    <Clock className="w-2.5 h-2.5 mr-0.5" />
                    {durationMins}m
                  </Badge>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Modal scrollable body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 min-h-0">
            {editedLogs.map((log, logIdx) => (
              <div
                key={log.id || logIdx}
                className="rounded-xl border border-border/60 bg-card p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Clickable exercise title navigates to /progress?exercise=<exercise_name> */}
                  <Link
                    href={`/progress?exercise=${encodeURIComponent(
                      log.exerciseName
                    )}`}
                    onClick={onClose}
                    className="font-bold text-sm text-foreground hover:text-blue-400 transition-colors flex items-center gap-1.5 group/link"
                    title={`View ${log.exerciseName} in Progress tab`}
                  >
                    <span>{log.exerciseName}</span>
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400 opacity-60 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 transition-all" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => requestDeleteExercise(logIdx)}
                    className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove exercise"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sets table */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-[30px_1fr_1fr_30px] gap-2 text-[10px] font-bold uppercase text-muted-foreground/70 px-1">
                    <span>#</span>
                    <span className="text-center">Load ({globalUnit})</span>
                    <span className="text-center">Reps</span>
                    <span />
                  </div>
                  {log.sets.map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className="grid grid-cols-[30px_1fr_1fr_30px] gap-2 items-center"
                    >
                      <span className="text-xs text-muted-foreground font-mono text-center">
                        {set.setNumber}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={set.weight || ""}
                        onChange={(e) =>
                          updateSet(logIdx, setIdx, "weight", e.target.value)
                        }
                        className="h-8 text-xs text-center font-mono bg-secondary/40 border-border/50 px-2"
                        placeholder="0"
                      />
                      <Input
                        type="number"
                        min={0}
                        value={set.reps || ""}
                        onChange={(e) =>
                          updateSet(logIdx, setIdx, "reps", e.target.value)
                        }
                        className="h-8 text-xs text-center font-mono bg-secondary/40 border-border/50 px-2"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => removeSet(logIdx, setIdx)}
                        disabled={log.sets.length <= 1}
                        className="p-1 text-muted-foreground/40 hover:text-destructive disabled:opacity-0 transition-colors flex items-center justify-center"
                        title={
                          log.sets.length <= 1
                            ? "At least 1 set required"
                            : "Remove set"
                        }
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addSet(logIdx)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 pt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Set
                </button>
              </div>
            ))}

            {/* Add Exercise */}
            {showExercisePicker ? (
              <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search exercise…"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    autoFocus
                    className="pl-8 h-8 text-xs bg-secondary/40 border-border/50"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {filteredExercises.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => addExercise(ex.id)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-secondary/70 text-xs transition-colors flex items-center gap-2"
                    >
                      <Dumbbell className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{ex.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {ex.primaryMuscle}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowExercisePicker(false)}
                  className="text-xs text-muted-foreground hover:text-foreground pt-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowExercisePicker(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500/5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Exercise
              </button>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between w-full border-t border-border/50 px-3.5 py-3 sm:px-6 sm:py-4 bg-secondary/15 shrink-0 gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setDeleteSessionAlertOpen(true)}
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>
                Delete<span className="hidden sm:inline"> Session</span>
              </span>
            </Button>
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
                className="h-9 sm:h-10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="h-9 sm:h-10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>
                  Save<span className="hidden sm:inline"> Changes</span>
                </span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation AlertDialog for Last Exercise Deletion Only */}
      <AlertDialog
        open={lastExerciseAlertOpen}
        onOpenChange={setLastExerciseAlertOpen}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing this last exercise will delete the whole session, are you
              sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLastExerciseAlertOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteLastExercise}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation AlertDialog for Entire Session Deletion */}
      <AlertDialog
        open={deleteSessionAlertOpen}
        onOpenChange={setDeleteSessionAlertOpen}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entire workout session? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteSessionAlertOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteSession}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default SessionDetailDialog;
