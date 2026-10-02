"use client";

import React, { useState, useMemo, useEffect } from "react";
import { WorkoutSession, WorkoutLog } from "@/types";
import { exercises, muscleGroupColors } from "@/lib/exercises";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  X,
  Calendar,
  Clock,
  Dumbbell,
  TrendingUp,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Target,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface SessionDetailsModalProps {
  session: WorkoutSession | null;
  isOpen: boolean;
  onClose: () => void;
  allWorkouts: WorkoutLog[];
}

export function SessionDetailsModal({
  session,
  isOpen,
  onClose,
  allWorkouts,
}: SessionDetailsModalProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !session) return null;

  // Session stats calculations
  const totalExercises = session.logs?.length || 0;
  const totalSets = session.logs?.reduce(
    (sum, log) => sum + (log.sets?.length || 0),
    0
  ) || 0;
  const totalVolume = session.logs?.reduce(
    (sum, log) =>
      sum +
      (log.sets?.reduce(
        (setSum, s) => setSum + (s.reps || 0) * (s.weight || 0),
        0
      ) || 0),
    0
  ) || 0;

  // Format session date
  const sessionDateObj = new Date(session.date);
  const formattedFullDate = !isNaN(sessionDateObj.getTime())
    ? sessionDateObj.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : session.date;

  const formattedTime = !isNaN(sessionDateObj.getTime())
    ? sessionDateObj.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const durationText = session.durationSeconds
    ? formatDuration(session.durationSeconds)
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-background/95 border border-border/80 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative border-b border-border/70 p-5 sm:p-6 bg-gradient-to-r from-card via-card/90 to-secondary/30">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs font-medium"
                >
                  Completed Session
                </Badge>
                {durationText && (
                  <Badge
                    variant="outline"
                    className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {durationText}
                  </Badge>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {formattedFullDate}
              </h2>
              {formattedTime && (
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  Started at {formattedTime}
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/70 shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-secondary/40 border border-border/60 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Exercises</span>
                <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-bold font-mono">{totalExercises}</div>
              <div className="text-[11px] text-muted-foreground">performed</div>
            </div>

            <div className="bg-secondary/40 border border-border/60 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Total Sets</span>
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-bold font-mono">{totalSets}</div>
              <div className="text-[11px] text-muted-foreground">logged</div>
            </div>

            <div className="bg-secondary/40 border border-border/60 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Volume Lifted</span>
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-bold font-mono text-purple-400">
                {totalVolume.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  kg
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">reps × load</div>
            </div>

            <div className="bg-secondary/40 border border-border/60 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Avg Volume/Ex</span>
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {totalExercises > 0
                  ? Math.round(totalVolume / totalExercises).toLocaleString()
                  : 0}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  kg
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">per exercise</div>
            </div>
          </div>

          {session.notes && (
            <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border/70 text-xs sm:text-sm text-muted-foreground">
              <span className="font-semibold text-foreground mr-1.5">Note:</span>
              {session.notes}
            </div>
          )}
        </div>

        {/* Exercises Scrollable Details Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Exercises in this Session ({totalExercises})
            </h3>
            <span className="text-xs text-muted-foreground">
              Includes sets breakdown & progression history
            </span>
          </div>

          {session.logs && session.logs.length > 0 ? (
            <div className="space-y-6">
              {session.logs.map((log, index) => (
                <ExerciseDetailCard
                  key={log.id || `${session.id}_ex_${index}`}
                  log={log}
                  session={session}
                  allWorkouts={allWorkouts}
                  index={index + 1}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No exercise logs found for this session.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/70 p-4 bg-card/60 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Hypertrophy Lab Session Analytics
          </p>
          <div className="flex items-center gap-2">
            <Link href="/progress" onClick={onClose}>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-border text-muted-foreground hover:text-foreground"
              >
                Full Progress Hub <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Individual Exercise Card with Sets & Line Graph
// ──────────────────────────────────────────
function ExerciseDetailCard({
  log,
  session,
  allWorkouts,
  index,
}: {
  log: WorkoutLog;
  session: WorkoutSession;
  allWorkouts: WorkoutLog[];
  index: number;
}) {
  const [metric, setMetric] = useState<"weight" | "volume">("weight");
  const [isExpanded, setIsExpanded] = useState(true);

  // Metadata from exercise catalog
  const exerciseMeta = exercises.find((e) => e.id === log.exerciseId);
  const primaryColors = exerciseMeta
    ? muscleGroupColors[exerciseMeta.primaryMuscle] || {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
      }
    : { bg: "bg-blue-500/10", text: "text-blue-400" };

  const secondaryColors = exerciseMeta?.secondaryMuscle
    ? muscleGroupColors[exerciseMeta.secondaryMuscle] || {
        bg: "bg-secondary",
        text: "text-muted-foreground",
      }
    : null;

  // Exercise performance in this session
  const sets = log.sets || [];
  const topWeight =
    sets.length > 0 ? Math.max(...sets.map((s) => s.weight)) : 0;
  const topSet = sets.find((s) => s.weight === topWeight);
  const sessionVolume = sets.reduce(
    (sum, s) => sum + (s.reps || 0) * (s.weight || 0),
    0
  );

  // Progression Line Graph Data
  // Retrieve ALL historical logs for this specific exercise
  const { chartData, allTimePR, firstRecordedWeight } = useMemo(() => {
    const historicalLogs = allWorkouts
      .filter((w) => w.exerciseId === log.exerciseId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let maxWeightEver = 0;
    let initialWeight = 0;

    const data = historicalLogs.map((hLog, idx) => {
      const bestWeight = Math.max(...(hLog.sets?.map((s) => s.weight) || [0]));
      const vol = (hLog.sets || []).reduce(
        (acc, s) => acc + (s.reps || 0) * (s.weight || 0),
        0
      );
      if (idx === 0) initialWeight = bestWeight;
      if (bestWeight > maxWeightEver) maxWeightEver = bestWeight;

      const d = new Date(hLog.date);
      const isThisSession =
        hLog.id === log.id ||
        (hLog.sessionId && hLog.sessionId === session.id) ||
        (hLog.date === session.date && hLog.exerciseId === log.exerciseId);

      return {
        id: hLog.id,
        date: !isNaN(d.getTime())
          ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : `S${idx + 1}`,
        fullDate: !isNaN(d.getTime())
          ? d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : hLog.date,
        weight: bestWeight,
        volume: vol,
        reps: hLog.sets?.find((s) => s.weight === bestWeight)?.reps || 0,
        setsCount: hLog.sets?.length || 0,
        isCurrent: isThisSession,
        unit: hLog.unit || "kg",
      };
    });

    return {
      chartData: data,
      allTimePR: maxWeightEver,
      firstRecordedWeight: initialWeight,
    };
  }, [allWorkouts, log.exerciseId, log.id, session.id, session.date]);

  const isPRSession = topWeight > 0 && topWeight >= allTimePR;
  const netGain =
    chartData.length > 1 && firstRecordedWeight > 0
      ? topWeight - firstRecordedWeight
      : 0;

  return (
    <Card className="border border-border/80 bg-card/70 overflow-hidden shadow-sm hover:border-border transition-colors">
      <div className="p-4 sm:p-5">
        {/* Exercise Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="font-mono text-sm font-bold text-blue-400">
                #{index}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-base sm:text-lg text-foreground">
                  {log.exerciseName}
                </h4>
                {isPRSession && (
                  <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] gap-1 px-2">
                    <Award className="w-3 h-3 text-amber-400" />
                    PR Session
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {exerciseMeta?.primaryMuscle && (
                  <Badge
                    variant="secondary"
                    className={`${primaryColors.bg} ${primaryColors.text} border-0 text-[11px] px-2 py-0.5`}
                  >
                    {exerciseMeta.primaryMuscle}
                  </Badge>
                )}
                {secondaryColors && exerciseMeta?.secondaryMuscle && (
                  <Badge
                    variant="secondary"
                    className={`${secondaryColors.bg} ${secondaryColors.text} border-0 text-[11px] px-2 py-0.5`}
                  >
                    {exerciseMeta.secondaryMuscle}
                  </Badge>
                )}
                {exerciseMeta?.equipment && (
                  <span className="text-xs text-muted-foreground ml-1">
                    • {exerciseMeta.equipment}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Top Load</p>
              <p className="text-sm font-bold font-mono text-blue-400">
                {topWeight}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  {log.unit || "kg"}
                </span>
              </p>
            </div>
            <div className="h-7 w-px bg-border/60" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="text-sm font-bold font-mono text-foreground">
                {sessionVolume.toLocaleString()}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  {log.unit || "kg"}
                </span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground p-1.5 h-8 w-8 ml-1"
              aria-label={isExpanded ? "Collapse exercise" : "Expand exercise"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="pt-4 space-y-5">
            {/* Sets Breakdown Table */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Sets Performed in this Session ({sets.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {sets.map((set, sIdx) => {
                  const isSetTop = set.weight === topWeight && topWeight > 0;
                  const setVol = (set.reps || 0) * (set.weight || 0);
                  return (
                    <div
                      key={sIdx}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        isSetTop
                          ? "bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20"
                          : "bg-secondary/30 border-border/60 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                        <span>Set {set.setNumber || sIdx + 1}</span>
                        {isSetTop && (
                          <span className="text-[10px] font-semibold text-blue-400">
                            ★ Top
                          </span>
                        )}
                      </div>
                      <div className="text-base font-bold font-mono text-foreground">
                        {set.weight}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          {log.unit || "kg"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {set.reps} reps
                      </div>
                      <div className="text-[10px] text-muted-foreground/80 mt-1 font-mono">
                        {setVol} kg vol
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {log.notes && (
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground mr-1">
                  Exercise Note:
                </span>
                {log.notes}
              </div>
            )}

            {/* PROGRESS LINE GRAPH OF THIS SPECIFIC EXERCISE */}
            <div className="rounded-xl border border-border/80 bg-secondary/20 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm text-foreground">
                      Progress Over Time — {log.exerciseName}
                    </h5>
                    <p className="text-[11px] text-muted-foreground">
                      Tracking progressive overload across {chartData.length}{" "}
                      {chartData.length === 1 ? "session" : "sessions"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {/* Metric Toggle */}
                  <div className="inline-flex rounded-lg bg-secondary/70 p-0.5 border border-border/70 text-xs">
                    <button
                      type="button"
                      onClick={() => setMetric("weight")}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        metric === "weight"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Top Load (kg)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetric("volume")}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        metric === "volume"
                          ? "bg-purple-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Volume (kg)
                    </button>
                  </div>

                  <Link href={`/progress`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                    >
                      Hub <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Progress Graph Visual */}
              {chartData.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-center p-4">
                  <Dumbbell className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No progression points recorded yet for this exercise.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="w-full h-48 sm:h-52 pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 12, left: -22, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id={`grad-${log.exerciseId}-${metric}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={
                                metric === "weight" ? "#3b82f6" : "#a855f7"
                              }
                              stopOpacity={0.45}
                            />
                            <stop
                              offset="95%"
                              stopColor={
                                metric === "weight" ? "#3b82f6" : "#a855f7"
                              }
                              stopOpacity={0.0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(148, 163, 184, 0.12)"
                        />
                        <XAxis
                          dataKey="date"
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          domain={[
                            (dataMin: number) =>
                              Math.max(0, Math.floor(dataMin * 0.85)),
                            (dataMax: number) => Math.ceil(dataMax * 1.15),
                          ]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "rgba(148, 163, 184, 0.25)",
                            borderRadius: "10px",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6)",
                            padding: "8px 12px",
                          }}
                          labelStyle={{ color: "#94a3b8", fontWeight: 600, fontSize: "12px" }}
                          formatter={(value: any, name: any, item: any) => {
                            const isCur = item.payload.isCurrent;
                            const label =
                              metric === "weight"
                                ? "Top Load"
                                : "Session Volume";
                            return [
                              `${value} kg${isCur ? " (This Session)" : ""}`,
                              label,
                            ];
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey={metric}
                          stroke={metric === "weight" ? "#3b82f6" : "#a855f7"}
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill={`url(#grad-${log.exerciseId}-${metric})`}
                          dot={(dotProps: any) => {
                            const { cx, cy, payload } = dotProps;
                            if (payload.isCurrent) {
                              return (
                                <g key={`dot-current-${payload.id}`}>
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={8}
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    className="animate-pulse"
                                  />
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={5}
                                    fill="#10b981"
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                  />
                                </g>
                              );
                            }
                            return (
                              <circle
                                key={`dot-${payload.id || cx}`}
                                cx={cx}
                                cy={cy}
                                r={3.5}
                                fill={metric === "weight" ? "#60a5fa" : "#c084fc"}
                                stroke="#0f172a"
                                strokeWidth={1.5}
                              />
                            );
                          }}
                          activeDot={{
                            r: 6,
                            fill: metric === "weight" ? "#60a5fa" : "#c084fc",
                            stroke: "#ffffff",
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Progression Footer Stats */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-border/50 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
                        Green marker: This Session
                      </span>
                      {chartData.length > 1 && (
                        <span className="text-muted-foreground">
                          All-time PR:{" "}
                          <strong className="text-foreground font-mono">
                            {allTimePR} kg
                          </strong>
                        </span>
                      )}
                    </div>

                    {chartData.length > 1 ? (
                      <div className="font-medium text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        {netGain > 0
                          ? `+${netGain} kg progression since baseline`
                          : netGain === 0
                          ? "Matched baseline load"
                          : `${netGain} kg from baseline`}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-[11px] italic">
                        Baseline recorded ({topWeight} kg) — future workouts will
                        chart your progressive overload trajectory!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ──────────────────────────────────────────
// Time formatter helper
// ──────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0m";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
}
