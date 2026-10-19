import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Dumbbell,
  LineChart,
  Bot,
  ShieldCheck,
  Zap,
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Timer,
  TrendingUp,
  Calendar,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About — Muscle Lab",
  description:
    "Muscle Lab is a clean, powerful, and easy-to-use weight training logger and workout tracker engineered for lifters of all experience levels.",
};

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* ── 1. HERO HEADER ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#121215] border border-[#222226] p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-[#FF1E27]/15 via-transparent to-transparent blur-2xl" />

        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#2B0A0C] border border-[#FF1E27]/30 text-[#FF1E27] text-[10px] font-mono font-bold tracking-widest uppercase">
            <Sparkles className="w-3 h-3" />
            CLEAN &amp; POWERFUL WEIGHT TRAINING LOGGER
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-[1.15] font-display">
            Simple, Powerful Weight Training.
          </h1>

          <p className="text-xs sm:text-sm text-[#888890] leading-relaxed">
            Muscle Lab was built to solve a simple problem: mainstream workout trackers are crowded with social feeds, confusing menus, and distracting clutter. We stripped away the noise to engineer a clean, focused, and reliable weight training logger designed for lifters of all experience levels—from your first barbell session to advanced strength milestones.
          </p>

          <div className="flex items-center gap-1.5 pt-2">
            <div className="h-1.5 w-6 rounded-xs bg-[#FF1E27] -skew-x-12" />
            <div className="h-1.5 w-3 rounded-xs bg-[#FF1E27]/60 -skew-x-12" />
          </div>
        </div>
      </div>

      {/* ── 2. CORE TRACKER CAPABILITIES ──────────────────────────────────── */}
      <section className="space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-[#222226]">
          <Dumbbell className="w-4 h-4 text-[#FF1E27]" />
          <h2 className="font-display text-sm font-bold tracking-wider text-white uppercase">
            Core Tracker Capabilities
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Capability 1: Frictionless Logging */}
          <div className="sm:col-span-2 lg:col-span-2 rounded-xl bg-[#121215] border border-[#222226] p-4 flex flex-col justify-between hover:border-[#FF1E27]/40 transition-colors group">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#2B0A0C] border border-[#FF1E27]/25 flex items-center justify-center text-[#FF1E27] group-hover:scale-105 transition-transform">
                <ClipboardCheck className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                1. Frictionless Logging
              </h3>
              <p className="text-xs text-[#888890] leading-relaxed">
                Log multi-set workouts with speed and precision. Rapidly enter weights and reps with instant validation safeguards that prevent accidental typos or invalid records. Check off sets to trigger auto-volume tracking and keep your training rhythm uninterrupted.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#1c1c22] text-[10px] font-mono text-[#FF1E27] flex items-center gap-1">
              <span>Multi-Set &amp; Rep Tracking · Validation Safeguards</span>
            </div>
          </div>

          {/* Capability 2: Rest Timer & Unit Conversions */}
          <div className="sm:col-span-1 lg:col-span-1 rounded-xl bg-[#121215] border border-[#222226] p-4 flex flex-col justify-between hover:border-[#FF1E27]/40 transition-colors group">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#2B0A0C] border border-[#FF1E27]/25 flex items-center justify-center text-[#FF1E27] group-hover:scale-105 transition-transform">
                <Timer className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                2. Rest Timer &amp; Unit Conversions
              </h3>
              <p className="text-xs text-[#888890] leading-relaxed">
                Stay on pace between sets with built-in countdown rest alerts and synthesized audio chimes. Switch between kilograms (kg) and pounds (lbs) globally across all views with seamless real-time conversions.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#1c1c22] text-[10px] font-mono text-[#FF1E27] flex items-center gap-1">
              <span>Countdown Rest Alerts · Instant kg/lbs Toggle</span>
            </div>
          </div>

          {/* Capability 3: Strength Analytics */}
          <div className="sm:col-span-1 lg:col-span-1 rounded-xl bg-[#121215] border border-[#222226] p-4 flex flex-col justify-between hover:border-[#FF1E27]/40 transition-colors group">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#2B0A0C] border border-[#FF1E27]/25 flex items-center justify-center text-[#FF1E27] group-hover:scale-105 transition-transform">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                3. Strength Analytics &amp; E1RM
              </h3>
              <p className="text-xs text-[#888890] leading-relaxed">
                Visualize progressive overload with dynamic line charts. Track strength milestones and evaluate capacity with automated Estimated 1-Rep Max (E1RM) formulas calculated via the validated Epley equation.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#1c1c22] text-[10px] font-mono text-[#FF1E27] flex items-center gap-1">
              <span>Progressive Overload Charts · Epley E1RM</span>
            </div>
          </div>

          {/* Capability 4: Routine & History Management */}
          <div className="sm:col-span-1 lg:col-span-1 rounded-xl bg-[#121215] border border-[#222226] p-4 flex flex-col justify-between hover:border-[#FF1E27]/40 transition-colors group">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#2B0A0C] border border-[#FF1E27]/25 flex items-center justify-center text-[#FF1E27] group-hover:scale-105 transition-transform">
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                4. Routine &amp; History Management
              </h3>
              <p className="text-xs text-[#888890] leading-relaxed">
                Organize your training with an interactive workout calendar, saved routines for repeatable splits, and fully editable session history to adjust weights, reps, or notes at any time.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#1c1c22] text-[10px] font-mono text-[#FF1E27] flex items-center gap-1">
              <span>Interactive Calendar · Saved Routines · Editable Logs</span>
            </div>
          </div>

          {/* Capability 5: Offline-First Data Reliability */}
          <div className="sm:col-span-2 lg:col-span-1 rounded-xl bg-[#121215] border border-[#222226] p-4 flex flex-col justify-between hover:border-[#FF1E27]/40 transition-colors group">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#2B0A0C] border border-[#FF1E27]/25 flex items-center justify-center text-[#FF1E27] group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                5. Offline-First Reliability
              </h3>
              <p className="text-xs text-[#888890] leading-relaxed">
                Work out anywhere without worrying about patchy gym Wi-Fi. Every set is immediately persisted to local storage, followed by fast, automated background synchronization with Supabase cloud storage.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#1c1c22] text-[10px] font-mono text-[#FF1E27] flex items-center gap-1">
              <span>Local Storage Fallback · Fast Supabase Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. ABOUT US & DESIGN PHILOSOPHY ────────────────────────────────── */}
      <section className="rounded-xl bg-[#121215] border border-[#222226] p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#222226]">
          <BookOpen className="w-4 h-4 text-[#FF1E27]" />
          <h2 className="font-display text-xs font-bold tracking-wider text-white uppercase">
            About Muscle Lab &amp; Our Philosophy
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#888890] leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-xs">Built for Every Lifter</h3>
            <p>
              Whether you are stepping into the gym for the first time, chasing a new barbell PR, or running a structured weekly split, Muscle Lab provides clean, distraction-free strength tracking. We eliminate tedious friction so you can focus on lifting, logging, and recovering.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-xs">Clear, Honest Progression</h3>
            <p>
              Real strength progression should be straightforward. By giving you intuitive set and rep logging, reliable volume calculations, and honest strength metrics, Muscle Lab helps you measure tangible improvements workout after workout.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. AGENT READINESS & MACHINE-READABILITY (Is-Agentic Specs) ────── */}
      <section className="rounded-xl bg-[#121215] border border-[#222226] p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#222226]">
          <Bot className="w-4 h-4 text-[#FF1E27]" />
          <h2 className="font-display text-xs font-bold tracking-wider text-white uppercase">
            Agent-Ready Web Architecture
          </h2>
        </div>

        <p className="text-xs text-[#888890] leading-relaxed">
          Muscle Lab is engineered for both everyday athletes and autonomous AI agents. We implement the latest agentic web specifications to provide pristine machine readability without sacrificing high-performance UI responsiveness:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          <div className="bg-[#16161a] border border-[#222226] rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF1E27]" />
              RFC 9110 Markdown
            </div>
            <p className="text-[11px] text-[#888890] leading-relaxed">
              HTTP content negotiation honors <code className="text-[#FF1E27] font-mono text-[10px]">Accept: text/markdown</code> and direct <code className="text-[#FF1E27] font-mono text-[10px]">.md</code> routes, serving token-efficient Markdown directly from edge middleware.
            </p>
          </div>

          <div className="bg-[#16161a] border border-[#222226] rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
              <Zap className="w-3.5 h-3.5 text-[#FF1E27]" />
              llms.txt Indexing
            </div>
            <p className="text-[11px] text-[#888890] leading-relaxed">
              Standardized <code className="text-[#FF1E27] font-mono text-[10px]">/llms.txt</code>, <code className="text-[#FF1E27] font-mono text-[10px]">/llms-full.txt</code>, and agent instructions guide LLMs on exact use cases, parameters, and site topography.
            </p>
          </div>

          <div className="bg-[#16161a] border border-[#222226] rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
              <Bot className="w-3.5 h-3.5 text-[#FF1E27]" />
              Agent-Friendly 404s
            </div>
            <p className="text-[11px] text-[#888890] leading-relaxed">
              Missing paths return structured Markdown recovery bodies containing canonical links, documentation pointers, and site maps for autonomous agent self-healing.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. QUICK LINKS / ACTIONS ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/log"
          className="flex items-center justify-between p-3.5 rounded-xl bg-[#121215] border border-[#222226] hover:border-[#FF1E27]/40 hover:bg-[#16161a] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8.5 h-8.5 rounded-lg bg-[#2B0A0C] border border-[#FF1E27]/30 flex items-center justify-center text-[#FF1E27]">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white font-display uppercase tracking-wider">
                Workout Logger
              </p>
              <p className="text-[10px] text-[#888890]">Start logging sets &amp; reps</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#888890] group-hover:text-[#FF1E27] group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/exercises"
          className="flex items-center justify-between p-3.5 rounded-xl bg-[#121215] border border-[#222226] hover:border-[#FF1E27]/40 hover:bg-[#16161a] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8.5 h-8.5 rounded-lg bg-[#2B0A0C] border border-[#FF1E27]/30 flex items-center justify-center text-[#FF1E27]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white font-display uppercase tracking-wider">
                Exercise Library
              </p>
              <p className="text-[10px] text-[#888890]">Browse movements &amp; muscles</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#888890] group-hover:text-[#FF1E27] group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/progress"
          className="flex items-center justify-between p-3.5 rounded-xl bg-[#121215] border border-[#222226] hover:border-[#FF1E27]/40 hover:bg-[#16161a] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8.5 h-8.5 rounded-lg bg-[#2B0A0C] border border-[#FF1E27]/30 flex items-center justify-center text-[#FF1E27]">
              <LineChart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white font-display uppercase tracking-wider">
                Strength Analytics
              </p>
              <p className="text-[10px] text-[#888890]">View strength curves &amp; 1RM</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#888890] group-hover:text-[#FF1E27] group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
}
