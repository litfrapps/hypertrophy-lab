"use client";

/**
 * FloatingBanner — Mobile floating session-in-progress pill.
 *
 * Shown above the bottom tab bar when a workout session is active and the
 * user navigates away from /log. Tapping returns them to the active session.
 *
 * Separated from Navbar so it can be toggled independently and tested in
 * isolation without requiring the full navigation tree.
 */

import Link from "next/link";
import { Zap } from "lucide-react";

interface FloatingBannerProps {
  elapsedSeconds: number;
  exerciseCount: number;
  firstExerciseName?: string;
  liveVolume: number;
  unit: string;
}

function fmtTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${p(h)}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

export function FloatingBanner({
  elapsedSeconds,
  exerciseCount,
  firstExerciseName,
  liveVolume,
  unit,
}: FloatingBannerProps) {
  const exerciseLabel = firstExerciseName
    ? `${firstExerciseName}${exerciseCount > 1 ? ` +${exerciseCount - 1}` : ""}`
    : `${exerciseCount} exercises`;

  return (
    <Link
      href="/log"
      className="lg:hidden fixed bottom-[68px] left-3 right-3 z-40"
      aria-label="Return to active workout session"
    >
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card/95 backdrop-blur-md
                   border border-emerald-500/40 shadow-xl shadow-emerald-500/10
                   hover:border-emerald-500/60 transition-all animate-fade-in-up"
        role="status"
        aria-live="polite"
      >
        {/* Pulsing dot */}
        <div
          className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"
          aria-hidden="true"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-emerald-400">
              {fmtTime(elapsedSeconds)}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              · {exerciseLabel}
            </span>
          </div>
          {liveVolume > 0 && (
            <p className="text-[9px] text-muted-foreground/60 mt-0.5">
              {liveVolume.toLocaleString()} {unit} logged
            </p>
          )}
        </div>

        {/* CTA chip */}
        <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold shrink-0 bg-emerald-500/15 px-2 py-1 rounded-lg">
          <Zap className="w-3 h-3" aria-hidden="true" />
          <span>Return</span>
        </div>
      </div>
    </Link>
  );
}
