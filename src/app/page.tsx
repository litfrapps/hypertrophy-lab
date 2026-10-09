"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWorkouts } from "@/hooks/use-workouts";
import { SessionDetailDialog } from "@/components/dashboard/session-detail-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Dumbbell,
  Calendar,
  Target,
  Activity,
  ArrowRight,
  ChevronRight,
  Search,
  Clock,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { WorkoutSession, WorkoutLog } from "@/types";

// Clipboard icon component matching document/clipboard icon
function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    workouts,
    sessions,
    isLoaded,
    updateSession,
    deleteSession,
    globalUnit,
    convertWeight,
  } = useWorkouts();

  const [selectedSessionForModal, setSelectedSessionForModal] =
    useState<WorkoutSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Compute Metrics
  const totalWorkouts = displaySessions.length;
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
  const thisWeekWorkouts = displaySessions.filter(
    (s) => new Date(s.date) >= weekStart
  );

  // Compute Volume Progress & Trajectory (4-week trend)
  const progressStats = useMemo(() => {
    if (!workouts || workouts.length === 0) {
      return {
        hasData: false,
        overloadBadgeText: "NO DATA",
        activeMesoText: "No active mesocycle",
        polylinePoints: "0,95 100,95 200,95 300,95",
        polygonPoints: "0,95 100,95 200,95 300,95 300,95 0,95",
        lastY: 95,
      };
    }

    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const week0Start = currentWeekStart.getTime() - 3 * weekMs;
    const week1Start = currentWeekStart.getTime() - 2 * weekMs;
    const week2Start = currentWeekStart.getTime() - 1 * weekMs;
    const week3Start = currentWeekStart.getTime();

    const getLogVol = (w: WorkoutLog) =>
      w.sets.reduce(
        (sum, s) =>
          sum +
          s.reps *
            convertWeight(s.weight, s.unit || w.unit || "kg", globalUnit),
        0
      );

    const v0 = workouts
      .filter((w) => {
        const t = new Date(w.date).getTime();
        return t >= week0Start && t < week1Start;
      })
      .reduce((acc, w) => acc + getLogVol(w), 0);

    const v1 = workouts
      .filter((w) => {
        const t = new Date(w.date).getTime();
        return t >= week1Start && t < week2Start;
      })
      .reduce((acc, w) => acc + getLogVol(w), 0);

    const v2 = workouts
      .filter((w) => {
        const t = new Date(w.date).getTime();
        return t >= week2Start && t < week3Start;
      })
      .reduce((acc, w) => acc + getLogVol(w), 0);

    const v3 = workouts
      .filter((w) => {
        const t = new Date(w.date).getTime();
        return t >= week3Start;
      })
      .reduce((acc, w) => acc + getLogVol(w), 0);

    let vols = [Math.round(v0), Math.round(v1), Math.round(v2), Math.round(v3)];
    let hasAny = vols.some((v) => v > 0);

    if (!hasAny && workouts.length > 0) {
      const sorted = [...workouts].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const chunkSize = Math.max(1, Math.ceil(sorted.length / 4));
      const buckets = [0, 0, 0, 0];
      sorted.forEach((w, idx) => {
        const b = Math.min(3, Math.floor(idx / chunkSize));
        buckets[b] += getLogVol(w);
      });
      vols = buckets.map((v) => Math.round(v));
      hasAny = vols.some((v) => v > 0);
    }

    if (!hasAny) {
      return {
        hasData: false,
        overloadBadgeText: "NO DATA",
        activeMesoText: "No active mesocycle",
        polylinePoints: "0,95 100,95 200,95 300,95",
        polygonPoints: "0,95 100,95 200,95 300,95 300,95 0,95",
        lastY: 95,
      };
    }

    let overloadBadgeText = "ACTIVE TRACKING";
    const cur = vols[3];
    const prev = vols[2] > 0 ? vols[2] : vols[1] > 0 ? vols[1] : vols[0];
    if (prev > 0 && cur > 0) {
      const pct = Math.round(((cur - prev) / prev) * 1000) / 10;
      overloadBadgeText = `${pct >= 0 ? `+${pct}%` : `${pct}%`} OVERLOAD`;
    } else if (cur > 0 && prev === 0) {
      overloadBadgeText = "BASELINE MESO";
    }

    const maxV = Math.max(...vols, 1);
    const y0 = Math.round(90 - (vols[0] / maxV) * 75);
    const y1 = Math.round(90 - (vols[1] / maxV) * 75);
    const y2 = Math.round(90 - (vols[2] / maxV) * 75);
    const y3 = Math.round(90 - (vols[3] / maxV) * 75);

    const polylinePoints = `0,${y0} 100,${y1} 200,${y2} 300,${y3}`;
    const polygonPoints = `0,${y0} 100,${y1} 200,${y2} 300,${y3} 300,95 0,95`;

    const activeWeeks = vols.filter((v) => v > 0).length;
    const activeMesoText = `${activeWeeks > 0 ? activeWeeks : 1}-Week Block`;

    return {
      hasData: true,
      overloadBadgeText,
      activeMesoText,
      polylinePoints,
      polygonPoints,
      lastY: y3,
    };
  }, [workouts, globalUnit, convertWeight]);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/exercises?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl mx-auto">
      {/* ─── DESKTOP TOP SEARCH & DISCOVERY BAR (Compact) ────────────────────── */}
      <div className="hidden lg:flex items-center justify-between gap-3 pb-3 border-b border-[#222226]">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#888890]" />
          <input
            type="text"
            placeholder="Search exercises, programs, or articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121215] border border-[#222226] rounded-lg pl-9 pr-10 py-1.5 text-xs text-white placeholder:text-[#888890] focus:outline-none focus:border-[#FF1E27]/70 focus:ring-1 focus:ring-[#FF1E27]/50 transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-[#1a1a1f] text-[#888890] rounded border border-[#222226]">
              ↵
            </kbd>
          </div>
        </form>

        <div className="flex items-center gap-2.5">
          <Link
            href="/log"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider bg-[#FF1E27] hover:bg-[#d6111a] text-white shadow-md shadow-[#FF1E27]/20 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            Start Session
          </Link>
        </div>
      </div>

      {/* ─── MAIN RESPONSIVE DASHBOARD LAYOUT ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* CENTER COLUMN (Full on mobile, col-span-8 on desktop) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-4.5">
          {/* ── 1. WELCOME HERO CARD (Crisp, less rounded) ─────────────────────── */}
          <div className="relative overflow-hidden rounded-xl bg-[#121215] border border-[#222226] p-4 sm:p-5 shadow-md">
            {/* Background Texture & 20KG Barbell Plate Image */}
            <div className="absolute right-0 top-0 bottom-0 w-3/5 sm:w-1/2 overflow-hidden pointer-events-none select-none">
              <img
                src="/images/hero-plate.jpg"
                alt="Olympic barbell weight plate"
                className="w-full h-full object-cover object-center opacity-80 mix-blend-screen"
              />
              {/* Cinematic dark gradients to blend into card */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#121215] via-[#121215]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent" />
            </div>

            {/* Hero Text Content */}
            <div className="relative z-10 max-w-[65%] sm:max-w-md">
              <p className="font-display text-[10px] font-bold text-[#FF1E27] tracking-[0.16em] uppercase">
                WELCOME BACK,
              </p>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1 leading-[1.18]">
                Train Smarter.
                <br />
                Build More.
              </h1>
              <p className="text-xs text-[#888890] mt-1.5 leading-relaxed font-normal">
                Your progress matters. Let&apos;s keep building.
              </p>

              {/* Red decorative slash rule */}
              <div className="flex items-center gap-1.5 mt-3">
                <div className="h-1.5 w-5 rounded-xs bg-[#FF1E27] -skew-x-12" />
                <div className="h-1.5 w-2.5 rounded-xs bg-[#FF1E27]/60 -skew-x-12" />
              </div>
            </div>
          </div>

          {/* ── 2. 2x2 STATS GRID (Compact & Crisp) ──────────────────────────── */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Card 1: TOTAL WORKOUTS */}
            <div className="rounded-xl bg-[#121215] border border-[#222226] p-3 sm:p-3.5 flex flex-col justify-between hover:border-[#FF1E27]/40 transition-all duration-200 group">
              <div>
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-[#2B0A0C] border border-[#FF1E27]/25 flex items-center justify-center text-[#FF1E27] mb-2 group-hover:scale-105 transition-transform">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <p className="font-display text-[10px] font-bold tracking-[0.12em] text-[#888890] uppercase">
                  TOTAL WORKOUTS
                </p>
              </div>
              <div className="flex items-end justify-between mt-1 pt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white leading-none font-sans">
                  {isLoaded ? totalWorkouts : "—"}
                </span>
                <Link
                  href="/progress"
                  className="w-6 h-6 rounded-full border border-[#FF1E27]/40 flex items-center justify-center text-[#FF1E27] hover:bg-[#FF1E27] hover:text-white transition-all cursor-pointer"
                  aria-label="View workout progress"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: THIS WEEK */}
            <div className="rounded-xl bg-[#121215] border border-[#222226] p-3 sm:p-3.5 flex flex-col justify-between hover:border-[#FF1E27]/40 transition-all duration-200 group">
              <div>
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-[#2B0A0C] border border-[#FF1E27]/25 flex items-center justify-center text-[#FF1E27] mb-2 group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="font-display text-[10px] font-bold tracking-[0.12em] text-[#888890] uppercase">
                  THIS WEEK
                </p>
              </div>
              <div className="flex items-end justify-between mt-1 pt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white leading-none font-sans">
                  {isLoaded ? thisWeekWorkouts.length : "—"}
                </span>
                <Link
                  href="/log"
                  className="w-6 h-6 rounded-full border border-[#FF1E27]/40 flex items-center justify-center text-[#FF1E27] hover:bg-[#FF1E27] hover:text-white transition-all cursor-pointer"
                  aria-label="View workouts this week"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: EXERCISES USED */}
            <div className="rounded-xl bg-[#121215] border border-[#222226] p-3 sm:p-3.5 flex flex-col justify-between hover:border-[#FF1E27]/40 transition-all duration-200 group">
              <div>
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-[#2B0A0C] border border-[#FF1E27]/25 flex items-center justify-center text-[#FF1E27] mb-2 group-hover:scale-105 transition-transform">
                  <Target className="w-4 h-4" />
                </div>
                <p className="font-display text-[10px] font-bold tracking-[0.12em] text-[#888890] uppercase">
                  EXERCISES USED
                </p>
              </div>
              <div className="flex items-end justify-between mt-1 pt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white leading-none font-sans">
                  {isLoaded ? totalExercises : "—"}
                </span>
                <Link
                  href="/exercises"
                  className="w-6 h-6 rounded-full border border-[#FF1E27]/40 flex items-center justify-center text-[#FF1E27] hover:bg-[#FF1E27] hover:text-white transition-all cursor-pointer"
                  aria-label="View exercises library"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 4: TOTAL VOLUME */}
            <div className="rounded-xl bg-[#121215] border border-[#222226] p-3 sm:p-3.5 flex flex-col justify-between hover:border-[#FF1E27]/40 transition-all duration-200 group">
              <div>
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-[#2B0A0C] border border-[#FF1E27]/25 flex items-center justify-center text-[#FF1E27] mb-2 group-hover:scale-105 transition-transform">
                  <Activity className="w-4 h-4" />
                </div>
                <p className="font-display text-[10px] font-bold tracking-[0.12em] text-[#888890] uppercase">
                  TOTAL VOLUME
                </p>
              </div>
              <div className="flex items-end justify-between mt-1 pt-0.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white leading-none font-sans">
                    {isLoaded
                      ? roundedVolume > 1000
                        ? `${(roundedVolume / 1000).toFixed(1)}k`
                        : roundedVolume.toLocaleString()
                      : "—"}
                  </span>
                  <span className="text-xs sm:text-sm font-normal text-[#888890]">
                    {globalUnit}
                  </span>
                </div>
                <Link
                  href="/progress"
                  className="w-6 h-6 rounded-full border border-[#FF1E27]/40 flex items-center justify-center text-[#FF1E27] hover:bg-[#FF1E27] hover:text-white transition-all cursor-pointer"
                  aria-label="View total volume progression"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* ── 3. QUICK ACTIONS SECTION (Compact) ───────────────────────────── */}
          <div className="space-y-3 pt-0.5">
            {/* Header with connecting line and triple-slash /// */}
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xs font-bold tracking-[0.18em] text-white shrink-0 uppercase">
                QUICK ACTIONS
              </h2>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-[#222226] via-[#FF1E27]/40 to-[#FF1E27]/80" />
              <span className="font-display font-black text-[#FF1E27] tracking-widest text-xs sm:text-sm shrink-0 select-none">
                {"///"}
              </span>
            </div>

            {/* Quick Action Cards (2-column prominent cards) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Card 1: LOG WORKOUT */}
              <Link href="/log" className="group block h-full">
                <div className="relative overflow-hidden rounded-xl bg-[#121215] border border-[#222226] p-3.5 sm:p-4 h-full group-hover:border-[#FF1E27]/60 group-hover:shadow-md group-hover:shadow-[#FF1E27]/10 transition-all duration-200">
                  {/* Background photo texture */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                    <img
                      src="/images/action-workout.jpg"
                      alt="Log workout texture"
                      className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-[#121215]/80 to-transparent" />
                  </div>

                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                      <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-[#2B0A0C] border border-[#FF1E27]/30 flex items-center justify-center text-[#FF1E27] mb-2 group-hover:border-[#FF1E27] transition-all">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <h3 className="font-display text-xs sm:text-sm font-bold tracking-wider text-white">
                        LOG WORKOUT
                      </h3>
                      <p className="text-[10.5px] text-[#888890] mt-0.5 leading-snug">
                        Track your sets, reps and progress.
                      </p>
                    </div>
                    <div className="mt-3 flex items-center text-[#888890] group-hover:text-[#FF1E27] group-hover:translate-x-1 transition-all">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Card 2: VIEW EXERCISES */}
              <Link href="/exercises" className="group block h-full">
                <div className="relative overflow-hidden rounded-xl bg-[#121215] border border-[#222226] p-3.5 sm:p-4 h-full group-hover:border-[#FF1E27]/60 group-hover:shadow-md group-hover:shadow-[#FF1E27]/10 transition-all duration-200">
                  {/* Background photo texture */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                    <img
                      src="/images/action-dumbbells.jpg"
                      alt="Exercises rack texture"
                      className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-[#121215]/80 to-transparent" />
                  </div>

                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                      <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-[#2B0A0C] border border-[#FF1E27]/30 flex items-center justify-center text-[#FF1E27] mb-2 group-hover:border-[#FF1E27] transition-all">
                        <DocumentIcon className="w-4 h-4 text-[#FF1E27]" />
                      </div>
                      <h3 className="font-display text-xs sm:text-sm font-bold tracking-wider text-white">
                        VIEW EXERCISES
                      </h3>
                      <p className="text-[10.5px] text-[#888890] mt-0.5 leading-snug">
                        Browse your exercise library.
                      </p>
                    </div>
                    <div className="mt-3 flex items-center text-[#888890] group-hover:text-[#FF1E27] group-hover:translate-x-1 transition-all">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* ── 4. RECENT SESSIONS SECTION (Compact) ─────────────────────────── */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xs font-bold tracking-[0.16em] text-white uppercase">
                  RECENT SESSIONS
                </h2>
                <p className="text-[10.5px] text-[#888890] mt-0.5">
                  Click any session to view and edit exercises, load, and sets
                </p>
              </div>
              {displaySessions.length > 0 && (
                <Link
                  href="/progress"
                  className="text-[11px] font-semibold text-[#888890] hover:text-[#FF1E27] transition-colors flex items-center gap-1"
                >
                  All logs <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {!isLoaded ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 rounded-lg bg-[#16161a] animate-pulse"
                  />
                ))}
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#222226] bg-[#121215] p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[#2B0A0C] border border-[#FF1E27]/30 flex items-center justify-center text-[#FF1E27] mx-auto mb-2">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-white">No sessions yet</h3>
                <p className="text-[11px] text-[#888890] mt-0.5 max-w-xs mx-auto">
                  Start logging your training sessions to track scientific overload progress.
                </p>
                <Link
                  href="/log"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider bg-[#FF1E27] hover:bg-[#d6111a] text-white shadow-sm shadow-[#FF1E27]/20 transition-all"
                >
                  Log First Session
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
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
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#222226] bg-[#121215] hover:border-[#FF1E27]/50 hover:bg-[#16161a] transition-all cursor-pointer group"
                    >
                      {/* Date block */}
                      <div className="w-8.5 h-8.5 rounded-lg bg-[#2B0A0C] border border-[#FF1E27]/20 flex flex-col items-center justify-center shrink-0 text-[#FF1E27] group-hover:border-[#FF1E27]/50 transition-colors">
                        <span className="text-[7.5px] font-bold font-display uppercase leading-none">
                          {isValidDate
                            ? sessionDate.toLocaleDateString("en-US", {
                                month: "short",
                              })
                            : "—"}
                        </span>
                        <span className="text-xs font-extrabold font-mono leading-tight mt-0.5">
                          {isValidDate ? sessionDate.getDate() : "—"}
                        </span>
                      </div>

                      {/* Middle metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white group-hover:text-[#FF1E27] transition-colors">
                            {dateString}
                          </span>
                          {timeString && (
                            <span className="text-[9.5px] text-[#888890]">
                              · {timeString}
                            </span>
                          )}
                          {durationMins && durationMins > 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-[#2B0A0C] text-[#FF1E27] border-0 text-[8.5px] px-1 py-0 h-3.5 font-mono rounded"
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
                              className="text-[8.5px] font-medium py-0 px-1 h-3.5 border-[#222226] text-[#888890] bg-[#16161a] rounded"
                            >
                              {log.exerciseName}
                              <span className="ml-0.5 opacity-60">
                                ({log.sets?.length || 0}s)
                              </span>
                            </Badge>
                          ))}
                          {exerciseCount > 3 && (
                            <Badge
                              variant="outline"
                              className="text-[8.5px] py-0 px-1 h-3.5 border-[#222226] text-[#888890] bg-[#16161a] rounded"
                            >
                              +{exerciseCount - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Right volume + actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs font-bold font-mono text-white">
                            {Math.round(sessionVol).toLocaleString()}
                            <span className="text-[9px] font-normal text-[#888890] ml-0.5">
                              {globalUnit}
                            </span>
                          </div>
                          <div className="text-[9.5px] text-[#888890]">
                            {exerciseCount}ex · {totalSetsCount}s
                          </div>
                        </div>
                        <div className="p-0.5 rounded text-[#888890] group-hover:text-[#FF1E27] group-hover:translate-x-0.5 transition-all">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── DESKTOP RIGHT-HAND SIDE PANEL (Compact & Crisp) ───────────────── */}
        <div className="hidden lg:flex lg:flex-col space-y-4 lg:col-span-4 sticky top-4">
          {/* Card A: TODAY'S FOCUS */}
          <div className="rounded-xl bg-[#121215] border border-[#222226] p-4 shadow-md relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#222226]">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF1E27]" />
                <h3 className="font-display text-xs font-bold tracking-[0.14em] text-white uppercase">
                  TODAY&apos;S FOCUS
                </h3>
              </div>
              <span className="font-display text-[8.5px] font-bold text-[#FF1E27] bg-[#2B0A0C] border border-[#FF1E27]/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                HYPERTROPHY
              </span>
            </div>

            {/* Split description */}
            <div className="mt-3 space-y-2.5">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-white">
                  Chest &amp; Triceps Hypertrophy
                </p>
                <p className="text-[11px] text-[#888890] mt-0.5 leading-relaxed">
                  Focus on lengthened-position tension and deep eccentric stretch.
                </p>
              </div>

              {/* Target Guidelines */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="bg-[#16161a] border border-[#222226] rounded-lg p-2">
                  <p className="text-[9px] text-[#888890] uppercase font-display tracking-wider">
                    TARGET VOLUME
                  </p>
                  <p className="text-xs font-bold text-white mt-0.5 font-mono">
                    14–18 Sets
                  </p>
                </div>
                <div className="bg-[#16161a] border border-[#222226] rounded-lg p-2">
                  <p className="text-[9px] text-[#888890] uppercase font-display tracking-wider">
                    INTENSITY (RIR)
                  </p>
                  <p className="text-xs font-bold text-white mt-0.5 font-mono">
                    1–2 RIR / RPE 8.5
                  </p>
                </div>
              </div>

              {/* Suggested Exercises */}
              <div className="space-y-1 pt-0.5">
                <p className="text-[9px] font-display font-semibold text-[#888890] tracking-wider uppercase">
                  PRIMARY MOVEMENTS
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#16161a] border border-[#222226]">
                    <span className="text-white text-[11px] font-medium">Incline Dumbbell Press</span>
                    <span className="text-[9.5px] font-mono text-[#FF1E27]">3-4 sets</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#16161a] border border-[#222226]">
                    <span className="text-white text-[11px] font-medium">Cable Chest Fly</span>
                    <span className="text-[9.5px] font-mono text-[#FF1E27]">3 sets</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#16161a] border border-[#222226]">
                    <span className="text-white text-[11px] font-medium">Overhead Cable Extension</span>
                    <span className="text-[9.5px] font-mono text-[#FF1E27]">3-4 sets</span>
                  </div>
                </div>
              </div>

              {/* Start Workout Button */}
              <Link
                href="/log"
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-[#FF1E27] to-[#d6111a] hover:from-[#d6111a] hover:to-[#b30e15] text-white font-display font-bold text-xs tracking-wider uppercase shadow-md shadow-[#FF1E27]/20 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                START WORKOUT
              </Link>
            </div>
          </div>

          {/* Card B: RECENT PROGRESS LINE CHART */}
          <div className="rounded-xl bg-[#121215] border border-[#222226] p-4 shadow-md relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#222226]">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#FF1E27]" />
                <h3 className="font-display text-xs font-bold tracking-[0.14em] text-white uppercase">
                  RECENT PROGRESS
                </h3>
              </div>
              <span
                className={`font-display text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  !progressStats.hasData
                    ? "text-[#888890] bg-[#1a1a1f] border border-[#222226]"
                    : "text-[#FF1E27] bg-[#2B0A0C] border border-[#FF1E27]/30"
                }`}
              >
                {progressStats.overloadBadgeText}
              </span>
            </div>

            {/* Sparkline Visual Graph */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#888890] text-[11px]">Volume Trajectory</span>
                <span className="font-mono text-white text-xs font-bold">
                  {isLoaded ? roundedVolume.toLocaleString() : "—"} {globalUnit}
                </span>
              </div>

              {/* SVG Curve Chart */}
              <div className="h-28 w-full pt-1">
                <svg
                  viewBox="0 0 300 100"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="crimsonGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF1E27" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#FF1E27" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1="0" y1="20" x2="300" y2="20" stroke="#222226" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="300" y2="60" stroke="#222226" strokeDasharray="3 3" />
                  <line x1="0" y1="95" x2="300" y2="95" stroke="#222226" />

                  {progressStats.hasData ? (
                    <>
                      {/* Area fill */}
                      <polygon
                        points={progressStats.polygonPoints}
                        fill="url(#crimsonGradient)"
                      />

                      {/* Crimson Stroke Line */}
                      <polyline
                        fill="none"
                        stroke="#FF1E27"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={progressStats.polylinePoints}
                      />

                      {/* Dot on final point */}
                      <circle cx="300" cy={progressStats.lastY} r="4" fill="#FF1E27" />
                      <circle cx="300" cy={progressStats.lastY} r="7" fill="#FF1E27" fillOpacity="0.3" />
                    </>
                  ) : (
                    <>
                      {/* Flatline baseline when no data */}
                      <line
                        x1="0"
                        y1="95"
                        x2="300"
                        y2="95"
                        stroke="#FF1E27"
                        strokeWidth="1.5"
                        opacity="0.4"
                      />
                      <text
                        x="150"
                        y="58"
                        textAnchor="middle"
                        fill="#888890"
                        fontSize="10"
                        fontFamily="sans-serif"
                      >
                        No workout volume logged yet
                      </text>
                    </>
                  )}
                </svg>
              </div>

              {/* Chart X-axis labels */}
              <div className="flex items-center justify-between text-[9px] font-mono text-[#888890] mt-1.5 px-0.5">
                <span>Wk 1</span>
                <span>Wk 2</span>
                <span>Wk 3</span>
                <span>Wk 4</span>
                <span className={progressStats.hasData ? "text-[#FF1E27] font-bold" : ""}>Current</span>
              </div>

              {/* Summary Bottom Info */}
              <div className="mt-3 pt-2 border-t border-[#222226] flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-[#888890]">Active Meso</p>
                  <p className="text-[11px] font-bold text-white">
                    {progressStats.activeMesoText}
                  </p>
                </div>
                <Link
                  href="/progress"
                  className="text-[11px] font-semibold text-[#FF1E27] hover:underline flex items-center gap-0.5"
                >
                  Full Analytics <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SESSION DETAILS MODAL ───────────────────────────────────────────── */}
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
