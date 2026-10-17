import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Dumbbell,
  LineChart,
  Bot,
  Brain,
  ShieldCheck,
  Zap,
  ArrowRight,
  Target,
  BarChart3,
  Layers,
  BookOpen,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About & Methodology — Hypertrophy Lab",
  description:
    "Explore the evidence-based exercise science, progressive overload formulas, and agentic machine-readable architecture powering Hypertrophy Lab.",
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
            EVIDENCE-BASED HYPERTROPHY ARCHITECTURE
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-[1.15] font-display">
            Science, Not Guesswork.
          </h1>

          <p className="text-xs sm:text-sm text-[#888890] leading-relaxed">
            Hypertrophy Lab was built to solve a simple problem: mainstream fitness trackers are crowded with social feeds, cardio gimmicks, and unscientific algorithms. We stripped away the noise to engineer a dedicated tracker grounded strictly in muscle physiology, mechanical tension, and systematic progressive overload.
          </p>

          <div className="flex items-center gap-1.5 pt-2">
            <div className="h-1.5 w-6 rounded-xs bg-[#FF1E27] -skew-x-12" />
            <div className="h-1.5 w-3 rounded-xs bg-[#FF1E27]/60 -skew-x-12" />
          </div>
        </div>
      </div>

      {/* ── 2. HYPERTROPHY METHODOLOGY PILLARS ────────────────────────────── */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#222226]">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#FF1E27]" />
            <h2 className="font-display text-sm font-bold tracking-wider text-white uppercase">
              The 3 Scientific Pillars of Hypertrophy
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#888890] uppercase tracking-wider">
            PHYSIOLOGY &amp; BIOMECHANICS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Pillar 1 */}
          <div className="rounded-xl bg-[#121215] border border-[#222226] p-4 flex flex-col justify-between hover:border-[#FF1E27]/40 transition-colors group">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#2B0A0C] border border-[#FF1E27]/25 flex items-center justify-center text-[#FF1E27] group-hover:scale-105 transition-transform">
                <Target className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                1. Mechanical Tension &amp; RIR
              </h3>
              <p className="text-xs text-[#888890] leading-relaxed">
                Mechanical tension is the primary stimulus for muscle protein synthesis. Training within <span className="text-white font-medium">1–3 Reps in Reserve (RIR / RPE 7–9.5)</span> ensures recruitment of high-threshold motor units, particularly when loading muscles at stretched or lengthened lengths.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#1c1c22] text-[10px] font-mono text-[#FF1E27] flex items-center gap-1">
              <span>Proximity to Failure: 1–3 RIR</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-xl bg-[#121215] border border-[#222226] p-4 flex flex-col justify-between hover:border-[#FF1E27]/40 transition-colors group">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#2B0A0C] border border-[#FF1E27]/25 flex items-center justify-center text-[#FF1E27] group-hover:scale-105 transition-transform">
                <BarChart3 className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                2. Systematic Progressive Overload
              </h3>
              <p className="text-xs text-[#888890] leading-relaxed">
                Muscles adapt to demands imposed upon them. We track longitudinal session tonnage and calculate estimated 1RM using the validated <span className="text-white font-medium">Epley equation: [weight × (1 + reps / 30)]</span> to confirm genuine strength and workload progressions across mesocycles.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#1c1c22] text-[10px] font-mono text-[#FF1E27] flex items-center gap-1">
              <span>Scientific Formula: Epley e1RM</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-xl bg-[#121215] border border-[#222226] p-4 flex flex-col justify-between hover:border-[#FF1E27]/40 transition-colors group">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#2B0A0C] border border-[#FF1E27]/25 flex items-center justify-center text-[#FF1E27] group-hover:scale-105 transition-transform">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                3. Autoregulated Volume Landmarks
              </h3>
              <p className="text-xs text-[#888890] leading-relaxed">
                Hypertrophy stimulus scales with hard working sets up to recovery limits. We structure mesocycles between <span className="text-white font-medium">Minimum Effective Volume (MEV, 8–10 sets/week)</span> and <span className="text-white font-medium">Maximum Recoverable Volume (MRV, 18–22 sets/week)</span> to avert systemic burnout.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#1c1c22] text-[10px] font-mono text-[#FF1E27] flex items-center gap-1">
              <span>Volume Target: MEV → MRV</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. ABOUT US & DESIGN PHILOSOPHY ────────────────────────────────── */}
      <section className="rounded-xl bg-[#121215] border border-[#222226] p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#222226]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#FF1E27]" />
            <h2 className="font-display text-xs font-bold tracking-wider text-white uppercase">
              About Us &amp; Our Philosophy
            </h2>
          </div>
          <span className="text-[9.5px] font-mono text-[#888890] uppercase tracking-wider">
            MISSION &amp; VALUES
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#888890] leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-xs">Built for Serious Resistance Lifters</h3>
            <p>
              Whether you are an aspiring bodybuilder, a strength athlete transitioning into a hypertrophy block, or an evidence-based coach, you need accurate data without cognitive friction. Hypertrophy Lab eliminates tedious inputs, offering lightning-fast set logging, built-in rest timers, and instant volume mathematics.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-xs">Grounded in Peer-Reviewed Science</h3>
            <p>
              Our exercise catalog and progression algorithms draw directly from modern hypertrophy literature published by researchers such as Dr. Brad Schoenfeld, Dr. Mike Israetel, Chris Beardsley, and Dr. Eric Helms. Every feature is weighed against its physiological utility.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. AGENT READINESS & MACHINE-READABILITY (Is-Agentic Specs) ────── */}
      <section className="rounded-xl bg-[#121215] border border-[#222226] p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#222226]">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#FF1E27]" />
            <h2 className="font-display text-xs font-bold tracking-wider text-white uppercase">
              Agent-Ready Web Architecture
            </h2>
          </div>
          <span className="text-[9.5px] font-mono text-[#FF1E27] tracking-wider uppercase font-semibold">
            RFC 9110 &amp; LLMS.TXT COMPLIANT
          </span>
        </div>

        <p className="text-xs text-[#888890] leading-relaxed">
          Hypertrophy Lab is designed for both human athletes and autonomous AI agents. We implement the latest agentic web specifications to provide pristine machine readability without sacrificing high-performance UI responsiveness:
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
              <p className="text-[10px] text-[#888890]">Start logging sets &amp; RIR</p>
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
              <p className="text-[10px] text-[#888890]">Browse biomechanics &amp; tension</p>
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
                Progress Analytics
              </p>
              <p className="text-[10px] text-[#888890]">View volume &amp; 1RM curves</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#888890] group-hover:text-[#FF1E27] group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
}
