"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWorkouts } from "@/hooks/use-workouts";
import { exercises } from "@/lib/exercises";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  Award,
  Calendar,
  Dumbbell,
  Flame,
  Trash2,
  ChevronsUpDown,
} from "lucide-react";
import Link from "next/link";

// ── SVG placeholder shown when exercise has no image or image fails to load ──
function ExercisePlaceholder() {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <rect width="36" height="36" rx="6" fill="currentColor" opacity="0.08" />
      <path
        d="M9 18h2m14 0h2M11 18v-3a1 1 0 011-1h1m10 4v-3a1 1 0 00-1-1h-1M13 14h10v8H13V14z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

// ── Square 1:1 thumbnail with SVG fallback ──
function ExerciseThumbnail({
  src,
  alt,
  className = "",
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={`w-9 h-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0 ${className}`}
      >
        <ExercisePlaceholder />
      </div>
    );
  }

  return (
    <div
      className={`w-9 h-9 rounded-md overflow-hidden bg-muted flex-shrink-0 ${className}`}
    >
      <img
        src={src}
        alt={alt}
        className="w-9 h-9 object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  );
}

function ProgressContent() {
  const {
    workouts,
    isLoaded,
    deleteWorkout,
    lifetimeSetCounts,
    topExerciseId,
    globalUnit,
    convertWeight,
  } = useWorkouts();
  const searchParams = useSearchParams();
  const exerciseParam = searchParams.get("exercise");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("barbell-squat");

  // ── Sort: most-logged first, zero-set exercises last, ties alphabetical ──
  const sortedExercises = useMemo(() => {
    return [...exercises].sort((a, b) => {
      const ca = lifetimeSetCounts[a.id] ?? 0;
      const cb = lifetimeSetCounts[b.id] ?? 0;
      if (ca !== cb) return cb - ca;
      return a.name.localeCompare(b.name);
    });
  }, [lifetimeSetCounts]);

  // Parse exercise from URL search param on load; fall back to topExerciseId
  useEffect(() => {
    if (exerciseParam) {
      const normalized = exerciseParam.trim().toLowerCase();
      const match = exercises.find(
        (e) =>
          e.name.toLowerCase() === normalized ||
          e.id.toLowerCase() === normalized ||
          e.name.toLowerCase().replace(/[^a-z0-9]/g, "") ===
            normalized.replace(/[^a-z0-9]/g, "") ||
          e.name.toLowerCase().includes(normalized) ||
          normalized.includes(e.name.toLowerCase())
      );
      if (match) {
        setSelectedExerciseId(match.id);
        return;
      }
    }

    if (!exerciseParam && topExerciseId) {
      setSelectedExerciseId(topExerciseId);
    }
  }, [exerciseParam, topExerciseId]);

  const currentExercise =
    exercises.find((e) => e.id === selectedExerciseId) || exercises[0];

  // Prepare chart data strictly from real workouts
  const { chartData, logsList } = useMemo(() => {
    const exerciseLogs = workouts
      .filter((w) => w.exerciseId === selectedExerciseId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (exerciseLogs.length > 0) {
      const data = exerciseLogs.map((log) => {
        const convertedSets = log.sets.map((s) => ({
          ...s,
          convertedWeight: convertWeight(
            s.weight,
            s.unit || log.unit || "kg",
            globalUnit
          ),
        }));
        const topSetWeight =
          convertedSets.length > 0
            ? Math.max(...convertedSets.map((s) => s.convertedWeight))
            : 0;
        const totalVolume = convertedSets.reduce(
          (sum, s) => sum + s.reps * s.convertedWeight,
          0
        );
        const topSetReps =
          convertedSets.find((s) => s.convertedWeight === topSetWeight)?.reps || 8;
        const d = new Date(log.date);
        return {
          date: d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          fullDate: log.date.split("T")[0],
          weight: topSetWeight,
          volume: Math.round(totalVolume),
          topSet: topSetWeight,
          reps: topSetReps,
          setsCount: log.sets.length,
          rawLog: log,
        };
      });
      return { chartData: data, logsList: exerciseLogs };
    }

    return { chartData: [], logsList: [] };
  }, [workouts, selectedExerciseId, globalUnit, convertWeight]);

  // High score stats
  const prWeight =
    chartData.length > 0 ? Math.max(...chartData.map((d) => d.weight)) : 0;
  const firstWeight = chartData.length > 0 ? chartData[0].weight : 0;
  const latestWeight =
    chartData.length > 0 ? chartData[chartData.length - 1].weight : 0;
  const weightGain =
    chartData.length > 1
      ? Math.round((latestWeight - firstWeight) * 10) / 10
      : 0;
  const percentageGain =
    firstWeight > 0
      ? Math.round(((latestWeight - firstWeight) / firstWeight) * 100)
      : 0;

  // Clear all logs for current exercise
  const handleClearAllExerciseLogs = () => {
    if (
      window.confirm(
        `Are you sure you want to clear all logged session records for ${currentExercise?.name}?`
      )
    ) {
      logsList.forEach((log) => {
        deleteWorkout(log.id);
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header — Log Session button intentionally removed */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
            Hypertrophy Overload Tracker
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Progressive Overload Graphs
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Monitor mechanical load progression over time — the primary driver of
          muscle hypertrophy.
        </p>
      </div>

      {/* Exercise Picker — Popover + Command (mobile-optimized, searchable) */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-xl border border-border">
        {/* Selected exercise preview */}
        <div className="flex items-center gap-3 min-w-0">
          <ExerciseThumbnail
            src={currentExercise?.image}
            alt={currentExercise?.name ?? "Exercise"}
            className="!w-10 !h-10 rounded-lg"
          />
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Selected Exercise</div>
            <div className="font-semibold text-foreground text-base truncate">
              {currentExercise?.name}
            </div>
          </div>
        </div>

        {/* Full-width searchable popover picker */}
        <div className="w-full sm:w-72">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger
              className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              aria-label="Select exercise"
            >
              <span className="truncate">
                {currentExercise?.name ?? "Choose an exercise…"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent
              className="p-0 w-[var(--anchor-width)] min-w-[280px]"
              align="start"
              side="bottom"
              sideOffset={6}
            >
              <Command>
                <div className="sticky top-0 z-10 bg-popover rounded-t-xl">
                  <CommandInput placeholder="Search exercises…" autoFocus />
                </div>
                <CommandList className="max-h-72">
                  <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                    No exercises found.
                  </CommandEmpty>
                  <CommandGroup>
                    {sortedExercises.map((ex) => {
                      const sets = lifetimeSetCounts[ex.id] ?? 0;
                      const isZero = sets === 0;
                      const isSelected = ex.id === selectedExerciseId;
                      return (
                        <CommandItem
                          key={ex.id}
                          value={ex.name}
                          data-checked={isSelected}
                          onSelect={() => {
                            setSelectedExerciseId(ex.id);
                            setPickerOpen(false);
                          }}
                          className={isZero ? "opacity-50" : ""}
                        >
                          {/* 1:1 thumbnail */}
                          <ExerciseThumbnail src={ex.image} alt={ex.name} />

                          {/* Exercise name (no muscle group parenthetical) */}
                          <span
                            className={`flex-1 truncate ${isZero
                                ? "text-muted-foreground/50"
                                : "text-foreground"
                              }`}
                          >
                            {ex.name}
                          </span>

                          {/* Lifetime sets count */}
                          <span className="ml-auto shrink-0 text-xs text-muted-foreground font-normal tabular-nums">
                            {sets} {sets === 1 ? "set" : "sets"}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">All-Time PR</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono">
              {prWeight}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {globalUnit}
              </span>
            </div>
            <div className="text-[11px] text-green-400 mt-1 flex items-center gap-0.5">
              <Flame className="w-3 h-3" /> Peak Weight
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Current Load</span>
              <Dumbbell className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono">
              {latestWeight}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {globalUnit}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Latest Session
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Net Progression
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {weightGain >= 0 ? `+${weightGain}` : weightGain}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {globalUnit}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {percentageGain > 0
                ? `+${percentageGain}% increase`
                : "Baseline recorded"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Tracked Sessions
              </span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono">
              {chartData.length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Logged datapoints
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Graphical Progress Line Chart */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Weight Progression ({currentExercise?.name})</span>
            <Badge
              variant="secondary"
              className="bg-blue-500/10 text-blue-400 border-0 font-mono text-xs"
            >
              Load ({globalUnit}) vs Time
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="py-20 text-center">
              <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground">
                No sessions recorded yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                Record your first set of {currentExercise?.name} in the workout
                logger to start visualizing your hypertrophy curve!
              </p>
              <Link href={`/log?exercise=${selectedExerciseId}`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Log First Session
                </Button>
              </Link>
            </div>
          ) : (
            <div className="w-full h-80 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.1)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      borderColor: "rgba(148, 163, 184, 0.2)",
                      borderRadius: "8px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    }}
                    labelStyle={{ color: "#94a3b8", fontWeight: 600 }}
                    formatter={(value: any, name: any) => {
                      if (name === "weight")
                        return [`${value} ${globalUnit}`, "Top Set Load"];
                      if (name === "volume")
                        return [`${Number(value).toLocaleString()} ${globalUnit}`, "Session Volume"];
                      return [value, name];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#weightGrad)"
                    activeDot={{
                      r: 6,
                      fill: "#60a5fa",
                      stroke: "#1d4ed8",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Log Table — Logged Session Records */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Logged Session Records</CardTitle>
          {chartData.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllExerciseLogs}
              className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8"
              title="Clear all logged session records for this exercise"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No session records logged yet for {currentExercise?.name}.
            </div>
          ) : (
            <div className="space-y-2">
              {chartData
                .slice()
                .reverse()
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors border border-border/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center font-mono font-bold text-xs text-blue-400">
                        {item.date}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {item.weight} {globalUnit}{" "}
                          <span className="text-xs text-muted-foreground font-normal">
                            × {item.reps} reps
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {item.setsCount} sets completed
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-mono font-semibold text-foreground">
                          {item.volume.toLocaleString()} {globalUnit}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Total Volume
                        </div>
                      </div>

                      {item.rawLog && (
                        <button
                          type="button"
                          onClick={() => deleteWorkout(item.rawLog.id)}
                          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete this record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-muted-foreground">
          Loading progress tracker...
        </div>
      }
    >
      <ProgressContent />
    </Suspense>
  );
}
