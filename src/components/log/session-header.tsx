"use client";

/**
 * SessionHeader — Active session top control bar
 *
 * Displays: elapsed timer | date/time picker | kg/lbs toggle | Cancel | Finish
 * Fully self-contained — reads session state from context, calls back for
 * open-modal requests (date modal, cancel alert, finish).
 */

import { Edit2, Calendar, Clock, Check, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/session-context";

interface SessionHeaderProps {
  onOpenDateModal: () => void;
  onCancelClick: () => void;
  onFinishClick: () => void;
  elapsedSeconds: number;
}

function fmtTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${p(h)}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

export function SessionHeader({
  onOpenDateModal,
  onCancelClick,
  onFinishClick,
  elapsedSeconds,
}: SessionHeaderProps) {
  const { sessionDate, unit, setUnit } = useSession();

  const displayDate = new Date(sessionDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="w-full bg-card border border-border/70 rounded-xl shadow-sm p-2.5 sm:p-3">
      <div className="w-full space-y-2.5">
        {/* Row 1: Timer + Date Picker */}
        <div className="flex items-center justify-between w-full">
          {/* Elapsed timer badge */}
          <div
            className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-blue-500/10
                       border border-blue-500/20 text-blue-400 font-mono font-bold text-sm"
            aria-label="Session elapsed time"
          >
            <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>{fmtTime(elapsedSeconds)}</span>
          </div>

          {/* Date/time picker button */}
          <button
            type="button"
            onClick={onOpenDateModal}
            className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-secondary/70
                       hover:bg-secondary border border-border/50 text-xs text-muted-foreground
                       hover:text-foreground transition-colors whitespace-nowrap"
            title="Adjust session date & time"
            aria-label="Adjust session date and time"
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{displayDate}</span>
            <Edit2 className="w-2.5 h-2.5 opacity-60 ml-0.5 shrink-0" />
          </button>
        </div>

        {/* Row 2: Unit Toggle + Actions */}
        <div className="flex items-center justify-between w-full">
          {/* kg / lbs toggle */}
          <div
            className="flex bg-secondary rounded-lg p-0.5 text-[11px] h-9 items-center
                       border border-border/40"
            role="group"
            aria-label="Weight unit"
          >
            {(["kg", "lbs"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`px-3 py-1 rounded-md font-semibold transition-all h-7 ${
                  unit === u
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={unit === u}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Cancel + Finish */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelClick}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-border/50
                         text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10
                         hover:border-destructive/30 transition-colors"
              title="Cancel workout — discard all sets"
              aria-label="Cancel workout"
            >
              <Ban className="w-4 h-4" />
            </button>

            <Button
              onClick={onFinishClick}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold
                         text-xs h-9 px-3 rounded-lg shadow-sm whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Finish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
