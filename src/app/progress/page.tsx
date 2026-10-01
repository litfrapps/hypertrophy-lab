"use client";

import { useState, useMemo } from "react";
import { useWorkouts } from "@/hooks/use-workouts";
import { exercises } from "@/lib/exercises";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
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
  ArrowUpRight,
  Flame,
  Plus,
} from "lucide-react";
import Link from "next/link";

// Sample initial data demonstrating the user's squat 90kg -> 100kg example if no workouts exist yet
const SAMPLE_SQUAT_DATA = [
  {
    date: "Sep 12",
    fullDate: "2026-09-12",
    weight: 80,
    volume: 1280,
    topSet: 80,
    reps: 8,
    setsCount: 2,
  },
  {
    date: "Sep 19",
    fullDate: "2026-09-19",
    weight: 85,
    volume: 1360,
    topSet: 85,
    reps: 8,
    setsCount: 2,
  },
  {
    date: "Sep 26",
    fullDate: "2026-09-26",
    weight: 90,
    volume: 1440,
    topSet: 90,
    reps: 8,
    setsCount: 2,
  },
  {
    date: "Oct 02",
    fullDate: "2026-10-02",
    weight: 100,
    volume: 1600,
    topSet: 100,
    reps: 8,
    setsCount: 2,
  },
];

export default function ProgressPage() {
  const { workouts, isLoaded } = useWorkouts();

  // Find unique exercises that have been logged
  const loggedExerciseIds = useMemo(() => {
    return Array.from(new Set(workouts.map((w) => w.exerciseId)));
  }, [workouts]);

  const defaultExerciseId =
    loggedExerciseIds[0] || "barbell-squat";
  const [selectedExerciseId, setSelectedExerciseId] =
    useState<string>(defaultExerciseId);

  // Sync if logged exercises change
  const currentExercise =
    exercises.find((e) => e.id === selectedExerciseId) || exercises[0];

  // Prepare chart data for selected exercise
  const { chartData, isDemoData, logsList } = useMemo(() => {
    const exerciseLogs = workouts
      .filter((w) => w.exerciseId === selectedExerciseId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (exerciseLogs.length > 0) {
      const data = exerciseLogs.map((log) => {
        const topSetWeight = Math.max(...log.sets.map((s) => s.weight));
        const totalVolume = log.sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
        const topSetReps = log.sets.find((s) => s.weight === topSetWeight)?.reps || 8;
        const d = new Date(log.date);
        return {
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          fullDate: log.date.split("T")[0],
          weight: topSetWeight,
          volume: totalVolume,
          topSet: topSetWeight,
          reps: topSetReps,
          setsCount: log.sets.length,
          rawLog: log,
        };
      });
      return { chartData: data, isDemoData: false, logsList: exerciseLogs };
    }

    // If no real logs yet, and looking at Squat, show sample progression
    if (selectedExerciseId === "barbell-squat") {
      return { chartData: SAMPLE_SQUAT_DATA, isDemoData: true, logsList: [] };
    }

    return { chartData: [], isDemoData: false, logsList: [] };
  }, [workouts, selectedExerciseId]);

  // High score stats
  const prWeight = chartData.length > 0 ? Math.max(...chartData.map((d) => d.weight)) : 0;
  const firstWeight = chartData.length > 0 ? chartData[0].weight : 0;
  const latestWeight = chartData.length > 0 ? chartData[chartData.length - 1].weight : 0;
  const weightGain = chartData.length > 1 ? latestWeight - firstWeight : 0;
  const percentageGain =
    firstWeight > 0 ? Math.round(((latestWeight - firstWeight) / firstWeight) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
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
            Monitor mechanical load progression over time — the primary driver of muscle hypertrophy.
          </p>
        </div>

        <Link href={`/log?exercise=${selectedExerciseId}`}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> Log Session
          </Button>
        </Link>
      </div>

      {/* Exercise Picker for Chart */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Selected Exercise</div>
            <div className="font-semibold text-foreground text-base">
              {currentExercise?.name}
            </div>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <Select
            value={selectedExerciseId}
            onValueChange={(val) => {
              if (val) setSelectedExerciseId(val);
            }}
          >
            <SelectTrigger className="bg-secondary/50 border-border">
              <SelectValue placeholder="Choose an exercise..." />
            </SelectTrigger>
            <SelectContent className="max-h-80 bg-card border-border">
              {exercises.map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>
                  {ex.name} ({ex.primaryMuscle})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Demo Notice */}
      {isDemoData && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex items-center justify-between">
          <span>
            💡 <strong>Demonstration Mode:</strong> Showing sample Squat progression (80kg → 90kg → 100kg). Log your own session to see live custom data!
          </span>
          <Link href="/log?exercise=barbell-squat">
            <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-400 hover:text-white">
              Log Real Squat <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">All-Time PR</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono">
              {prWeight} <span className="text-xs font-normal text-muted-foreground">kg</span>
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
              {latestWeight} <span className="text-xs font-normal text-muted-foreground">kg</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Latest Session
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Net Progression</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              +{weightGain} <span className="text-xs font-normal text-muted-foreground">kg</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {percentageGain > 0 ? `+${percentageGain}% increase` : "Baseline recorded"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Tracked Sessions</span>
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
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-0 font-mono text-xs">
              Load (kg) vs Time
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="py-20 text-center">
              <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground">No sessions recorded yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                Record your first set of {currentExercise?.name} to start visualizing your hypertrophy curve!
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
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
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
                      if (name === "weight") return [`${value} kg`, "Top Set Load"];
                      if (name === "volume") return [`${value} kg`, "Session Volume"];
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

      {/* History Log Table */}
      {chartData.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Logged Session Records</CardTitle>
          </CardHeader>
          <CardContent>
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
                          {item.weight} kg <span className="text-xs text-muted-foreground font-normal">× {item.reps} reps</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {item.setsCount} sets completed
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-semibold text-foreground">
                        {item.volume.toLocaleString()} kg
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Total Volume
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
