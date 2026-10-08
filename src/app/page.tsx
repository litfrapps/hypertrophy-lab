"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useWorkouts } from "@/hooks/use-workouts";
import { useUnit } from "@/contexts/unit-context";
import { exercises } from "@/lib/exercises";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SessionDetailDialog } from "@/components/dashboard/session-detail-dialog";
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
} from "lucide-react";
import { WorkoutSession, WorkoutLog } from "@/types";

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
      {selectedSessionForModal && (
        <SessionDetailDialog
          sessionId={selectedSessionForModal.id}
          session={selectedSessionForModal}
          onClose={() => setSelectedSessionForModal(null)}
          onSave={handleEditSave}
          onDeleteSession={handleDeleteSession}
        />
      )}
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

