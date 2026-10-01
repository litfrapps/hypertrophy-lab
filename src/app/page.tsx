"use client";

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
  Timer,
} from "lucide-react";

export default function DashboardPage() {
  const { workouts, isLoaded, getRecentWorkouts } = useWorkouts();
  const recentWorkouts = getRecentWorkouts(5);

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
      href: "/timer",
      label: "Rest Timer",
      description: "Customizable countdown timer",
      icon: Timer,
      gradient: "from-green-600 to-green-400",
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 via-cyan-600/10 to-purple-600/20 border border-border p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-medium text-orange-400">
              Science-Backed Training
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Welcome to{" "}
            <span className="gradient-text">Hypertrophy Lab</span>
          </h1>
          <p className="text-muted-foreground max-w-lg">
            Track your workouts, visualize progress, and optimize your training
            with peer-reviewed science from researchers like Brad Schoenfeld.
          </p>
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

      {/* Recent Workouts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Workouts</h2>
          {workouts.length > 0 && (
            <Link href="/progress">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>

        {!isLoaded ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-secondary/50 animate-pulse"
              />
            ))}
          </div>
        ) : recentWorkouts.length === 0 ? (
          <Card className="border-border bg-card border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Dumbbell className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-1">No workouts yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start logging your training to track your progress
              </p>
              <Link href="/log">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Log Your First Workout
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentWorkouts.map((workout) => {
              const exercise = exercises.find(
                (e) => e.id === workout.exerciseId
              );
              const totalVol = workout.sets.reduce(
                (sum, s) => sum + s.reps * s.weight,
                0
              );
              const maxWeight = Math.max(
                ...workout.sets.map((s) => s.weight)
              );
              return (
                <Card
                  key={workout.id}
                  className="border-border bg-card hover:bg-secondary/30 transition-colors"
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {workout.exerciseName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {new Date(workout.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {workout.sets.length} sets
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {maxWeight}
                        <span className="text-xs font-normal text-muted-foreground ml-0.5">
                          {workout.unit}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {totalVol.toLocaleString()} vol
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
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
