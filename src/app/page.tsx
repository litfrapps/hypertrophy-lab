"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useWorkouts } from "@/hooks/use-workouts";
import { useUnit } from "@/contexts/unit-context";
import { exercises } from "@/lib/exercises";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Dumbbell,
  TrendingUp,
  Calendar,
  Target,
  ArrowRight,
  Flame,
  BookOpen,
  Bot,
  Clock,
  ChevronRight,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { WorkoutSession, WorkoutLog, WorkoutSet } from "@/types";

// ─── Session Details Full Dialog / Modal ───────────────────────────────────────
function SessionDetailDialog({
  session,
  onClose,
  onSave,
  onDeleteSession,
}: {
  session: WorkoutSession | null;
  onClose: () => void;
  onSave: (s: WorkoutSession) => Promise<void> | void;
  onDeleteSession: (sessionId: string) => Promise<void> | void;
}) {
  const { globalUnit, convertWeight } = useUnit();
  const [editedLogs, setEditedLogs] = useState<WorkoutLog[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [lastExerciseAlertOpen, setLastExerciseAlertOpen] = useState(false);
  const [deleteSessionAlertOpen, setDeleteSessionAlertOpen] = useState(false);

  useEffect(() => {
    if (session) {
      setEditedLogs(
        session.logs.map((l) => ({
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
    } else {
      setEditedLogs([]);
    }
  }, [session, globalUnit, convertWeight]);

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
    if (session) {
      await onDeleteSession(session.id);
    }
    setLastExerciseAlertOpen(false);
    onClose();
  };

  const handleConfirmDeleteSession = async () => {
    if (session) {
      await onDeleteSession(session.id);
    }
    setDeleteSessionAlertOpen(false);
    onClose();
  };

  const addExercise = (exerciseId: string) => {
    const ex = exercises.find((e) => e.id === exerciseId);
    if (!ex || !session) return;
    const newLog: WorkoutLog = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      date: session.date,
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
    if (!session) return;
    const validLogs = editedLogs.filter((l) => l.sets.length > 0);
    if (validLogs.length === 0) {
      await onDeleteSession(session.id);
    } else {
      await onSave({ ...session, logs: validLogs });
    }
    onClose();
  };

  if (!session) return null;

  const sessionDate = new Date(session.date);
  const isValidDate = !isNaN(sessionDate.getTime());
  const dateFormatted = isValidDate
    ? sessionDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : session.date;
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
  const durationMins = session.durationSeconds
    ? Math.round(session.durationSeconds / 60)
    : null;

  return (
    <>
      <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden" showCloseButton={true}>
          <DialogHeader className="p-4 sm:p-5 border-b border-border/50 bg-secondary/15 shrink-0">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center justify-between gap-2">
              <span>Session Details — {dateFormatted}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
              {timeFormatted && <span>{timeFormatted}</span>}
              {timeFormatted && <span>·</span>}
              <span>{editedLogs.length} {editedLogs.length === 1 ? "exercise" : "exercises"}</span>
              <span>·</span>
              <span>{totalSetsCount} sets</span>
              <span>·</span>
              <span className="font-mono text-foreground font-semibold">
                {Math.round(totalVolume).toLocaleString()} {globalUnit}
              </span>
              {durationMins && durationMins > 0 && (
                <>
                  <span>·</span>
                  <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 border-0 text-[10px] px-1.5 py-0 h-4">
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
                    href={`/progress?exercise=${encodeURIComponent(log.exerciseName)}`}
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
                        title={log.sets.length <= 1 ? "At least 1 set required" : "Remove set"}
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
              <span>Delete<span className="hidden sm:inline"> Session</span></span>
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
                <span>Save<span className="hidden sm:inline"> Changes</span></span>
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
              Removing this last exercise will delete the whole session, are you sure you want to continue?
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
              Are you sure you want to delete this entire workout session? This action cannot be undone.
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { workouts, sessions, isLoaded, updateSession, deleteSession, globalUnit, convertWeight } = useWorkouts();
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<WorkoutSession | null>(null);

  // Group into sessions if sessions array is loaded, with fallback for any standalone logs
  const displaySessions = useMemo<WorkoutSession[]>(() => {
    if (sessions && sessions.length > 0) return sessions;
    if (!workouts || workouts.length === 0) return [];
    const map = new Map<string, WorkoutLog[]>();
    for (const w of workouts) {
      const key = w.sessionId || w.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return Array.from(map.entries()).map(([key, logs]) => ({
      id: key,
      date: logs[0]?.date || new Date().toISOString(),
      logs,
    }));
  }, [sessions, workouts]);

  const recentSessions = useMemo(
    () => displaySessions.slice(0, 5),
    [displaySessions]
  );

  // Stats
  const totalWorkouts = workouts.length;
  const totalExercises = new Set(workouts.map((w) => w.exerciseId)).size;
  const totalVolume = workouts.reduce(
    (sum, w) =>
      sum +
      w.sets.reduce(
        (s, set) =>
          s +
          set.reps *
            convertWeight(set.weight, set.unit || w.unit || "kg", globalUnit),
        0
      ),
    0
  );
  const roundedVolume = Math.round(totalVolume);

  // This week's workouts
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const thisWeekWorkouts = workouts.filter(
    (w) => new Date(w.date) >= weekStart
  );

  const stats = [
    {
      label: "Total Workouts",
      value: totalWorkouts,
      icon: Dumbbell,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "This Week",
      value: thisWeekWorkouts.length,
      icon: Calendar,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
    {
      label: "Exercises Used",
      value: totalExercises,
      icon: Target,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Total Volume",
      value:
        roundedVolume > 1000
          ? `${(roundedVolume / 1000).toFixed(1)}k`
          : roundedVolume.toLocaleString(),
      unit: globalUnit,
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  const quickActions = [
    {
      href: "/log",
      label: "Log Workout",
      description: "Record your sets & reps",
      icon: ClipboardIcon,
      gradient: "from-blue-600 to-blue-400",
    },
    {
      href: "/exercises",
      label: "Browse Exercises",
      description: "50+ exercises with guides",
      icon: Dumbbell,
      gradient: "from-cyan-600 to-cyan-400",
    },
    {
      href: "/progress",
      label: "View Progress",
      description: "Track your growth",
      icon: TrendingUp,
      gradient: "from-purple-600 to-purple-400",
    },
    {
      href: "/science",
      label: "Research Papers",
      description: "Learn from the science",
      icon: BookOpen,
      gradient: "from-amber-600 to-amber-400",
    },
    {
      href: "/ai",
      label: "AI Coach",
      description: "Ask science-based questions",
      icon: Bot,
      gradient: "from-pink-600 to-pink-400",
    },
  ];

  const handleEditSave = useCallback(
    async (updated: WorkoutSession) => {
      await updateSession(updated);
      setSelectedSessionForModal(null);
    },
    [updateSession]
  );

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      await deleteSession(sessionId);
      setSelectedSessionForModal(null);
    },
    [deleteSession]
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600/20 via-cyan-600/10 to-purple-600/20 border border-border px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="relative flex items-center gap-3">
          <Flame className="w-4 h-4 text-orange-400 shrink-0" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-tight">
              Welcome to{" "}
              <span className="gradient-text">Hypertrophy Lab</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Science-backed training tracker — log workouts, visualize progress
              &amp; optimize your gains.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-border bg-card hover:bg-secondary/50 transition-colors"
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">
                {isLoaded ? stat.value : "—"}
                {stat.unit && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {stat.unit}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="group border-border bg-card hover:bg-secondary/50 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer h-full">
                <CardContent className="p-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}
                  >
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Sessions — Compact List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Recent Sessions
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any session to view and edit exercises, load, and sets
            </p>
          </div>
          {displaySessions.length > 0 && (
            <Link href="/progress">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-8 text-xs"
              >
                All analytics <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          )}
        </div>

        {!isLoaded ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-secondary/50 animate-pulse"
              />
            ))}
          </div>
        ) : recentSessions.length === 0 ? (
          <Card className="border-border bg-card border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-1">No sessions yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start logging your training sessions to track your overload
                progress
              </p>
              <Link href="/log">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Log Your First Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => {
              const sessionDate = new Date(session.date);
              const isValidDate = !isNaN(sessionDate.getTime());
              const dateString = isValidDate
                ? sessionDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                : session.date;
              const timeString = isValidDate
                ? sessionDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : null;

              const exerciseCount = session.logs?.length || 0;
              const totalSetsCount =
                session.logs?.reduce(
                  (sum, l) => sum + (l.sets?.length || 0),
                  0
                ) || 0;
              const sessionVol =
                session.logs?.reduce(
                  (sum, l) =>
                    sum +
                    (l.sets?.reduce(
                      (sSum, s) =>
                        sSum +
                        (s.reps || 0) *
                          convertWeight(
                            s.weight || 0,
                            s.unit || l.unit || "kg",
                            globalUnit
                          ),
                      0
                    ) || 0),
                  0
                ) || 0;
              const durationMins = session.durationSeconds
                ? Math.round(session.durationSeconds / 60)
                : null;

              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setSelectedSessionForModal(session)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/60 bg-card hover:border-blue-500/50 hover:bg-secondary/40 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  {/* Date block */}
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex flex-col items-center justify-center shrink-0 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                    <span className="text-[8px] font-bold uppercase leading-none">
                      {isValidDate
                        ? sessionDate.toLocaleDateString("en-US", {
                            month: "short",
                          })
                        : "—"}
                    </span>
                    <span className="text-sm font-bold font-mono leading-tight">
                      {isValidDate ? sessionDate.getDate() : "—"}
                    </span>
                  </div>

                  {/* Middle: meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-foreground group-hover:text-blue-400 transition-colors">
                        {dateString}
                      </span>
                      {timeString && (
                        <span className="text-[10px] text-muted-foreground">
                          · {timeString}
                        </span>
                      )}
                      {durationMins && durationMins > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-cyan-500/10 text-cyan-400 border-0 text-[9px] px-1 py-0 h-4"
                        >
                          <Clock className="w-2 h-2 mr-0.5" />
                          {durationMins}m
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {session.logs?.slice(0, 3).map((log, idx) => (
                        <Badge
                          key={log.id || idx}
                          variant="outline"
                          className="text-[9px] font-normal py-0 px-1 h-4 border-border/40 text-muted-foreground bg-secondary/30"
                        >
                          {log.exerciseName}
                          <span className="ml-0.5 opacity-50">
                            ({log.sets?.length || 0}s)
                          </span>
                        </Badge>
                      ))}
                      {exerciseCount > 3 && (
                        <Badge
                          variant="outline"
                          className="text-[9px] py-0 px-1 h-4 border-border/30 text-muted-foreground"
                        >
                          +{exerciseCount - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Right: volume + actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold font-mono text-foreground">
                        {Math.round(sessionVol).toLocaleString()}
                        <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                          {globalUnit}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {exerciseCount}ex · {totalSetsCount}s
                      </div>
                    </div>
                    <div className="p-1 rounded-lg text-muted-foreground/40 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      <SessionDetailDialog
        session={selectedSessionForModal}
        onClose={() => setSelectedSessionForModal(null)}
        onSave={handleEditSave}
        onDeleteSession={handleDeleteSession}
      />
    </div>
  );
}

// Simple clipboard icon component
function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

