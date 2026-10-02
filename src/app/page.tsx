"use client";

import { useState, useMemo } from "react";
import { useWorkouts } from "@/hooks/use-workouts";
import { exercises } from "@/lib/exercises";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Layers,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { SessionDetailsModal } from "@/components/dashboard/session-details-modal";
import { WorkoutSession, WorkoutLog } from "@/types";

export default function DashboardPage() {
  const { workouts, sessions, isLoaded } = useWorkouts();
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

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
  const totalSets = workouts.reduce((sum, w) => sum + w.sets.length, 0);
  const totalVolume = workouts.reduce(
    (sum, w) => sum + w.sets.reduce((s, set) => s + set.reps * set.weight, 0),
    0
  );

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
      value: totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume,
      unit: "kg",
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

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600/20 via-cyan-600/10 to-purple-600/20 border border-border px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="relative flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400 shrink-0" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-tight">
              Welcome to{" "}
              <span className="gradient-text">Hypertrophy Lab</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Science-backed training tracker — log workouts, visualize progress &amp; optimize your gains.
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
              <p className="text-xs text-muted-foreground mt-1">
                {stat.label}
              </p>
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

      {/* Recent Sessions */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Recent Sessions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any workout session to inspect exercise breakdowns and progress line graphs
            </p>
          </div>
          {displaySessions.length > 0 && (
            <Link href="/progress">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground self-start sm:self-center">
                View all analytics <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>

        {!isLoaded ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-secondary/50 animate-pulse"
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
                Start logging your training sessions to track your overload progress
              </p>
              <Link href="/log">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Log Your First Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
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
              const totalSetsCount = session.logs?.reduce(
                (sum, l) => sum + (l.sets?.length || 0),
                0
              ) || 0;
              const sessionVol = session.logs?.reduce(
                (sum, l) =>
                  sum +
                  (l.sets?.reduce(
                    (sSum, s) => sSum + (s.reps || 0) * (s.weight || 0),
                    0
                  ) || 0),
                0
              ) || 0;

              const durationMins = session.durationSeconds
                ? Math.round(session.durationSeconds / 60)
                : null;

              return (
                <Card
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedSession(session);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="border-border/80 bg-card hover:bg-secondary/40 hover:border-blue-500/40 transition-all duration-200 cursor-pointer group shadow-xs active:scale-[0.995] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Icon & Session Meta */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-500/20 transition-all">
                          <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-blue-400 transition-colors">
                              {dateString}
                            </h3>
                            {timeString && (
                              <span className="text-xs text-muted-foreground">
                                • {timeString}
                              </span>
                            )}
                            {durationMins && durationMins > 0 && (
                              <Badge
                                variant="secondary"
                                className="bg-cyan-500/10 text-cyan-400 border-0 text-[10px] px-1.5 py-0.2"
                              >
                                <Clock className="w-2.5 h-2.5 mr-1" />
                                {durationMins}m
                              </Badge>
                            )}
                          </div>

                          {/* Exercise previews tags */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {session.logs?.slice(0, 3).map((log, idx) => (
                              <Badge
                                key={log.id || idx}
                                variant="outline"
                                className="bg-secondary/40 border-border/70 text-[11px] font-normal text-muted-foreground group-hover:border-blue-500/30"
                              >
                                {log.exerciseName}
                                <span className="ml-1 text-[10px] text-muted-foreground/70">
                                  ({log.sets?.length || 0}s)
                                </span>
                              </Badge>
                            ))}
                            {exerciseCount > 3 && (
                              <Badge
                                variant="outline"
                                className="bg-secondary/40 border-border/70 text-[10px] text-muted-foreground"
                              >
                                +{exerciseCount - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Summary Metrics & Action Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                        <div className="text-left sm:text-right">
                          <p className="text-sm sm:text-base font-bold font-mono text-foreground">
                            {sessionVol.toLocaleString()}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              kg vol
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"} • {totalSetsCount} sets
                          </p>
                        </div>

                        <div className="flex items-center text-xs font-medium text-blue-400 group-hover:text-blue-300">
                          <span className="hidden md:inline mr-1">Details</span>
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:translate-x-0.5 transition-all">
                            <ChevronRight className="w-4 h-4 text-blue-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Details Modal (with Exercise Progress Line Graphs) */}
      <SessionDetailsModal
        session={selectedSession}
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        allWorkouts={workouts}
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
