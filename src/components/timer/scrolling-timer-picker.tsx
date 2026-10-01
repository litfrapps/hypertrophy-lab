"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Check, Timer, Sparkles } from "lucide-react";

interface ScrollingTimerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSeconds: number;
  onSelect: (seconds: number) => void;
  exerciseName?: string;
}

// 15-second intervals up to 5 minutes (300 seconds)
export const TIMER_INTERVALS: number[] = Array.from(
  { length: 20 },
  (_, i) => (i + 1) * 15
);

export function formatIntervalLabel(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getScienceTag(seconds: number): string | null {
  if (seconds === 60) return "Isolation";
  if (seconds === 90) return "Standard";
  if (seconds === 120) return "Hypertrophy";
  if (seconds === 180) return "Compound (Schoenfeld)";
  if (seconds === 300) return "Max Rest";
  return null;
}

export function ScrollingTimerPicker({
  isOpen,
  onClose,
  currentSeconds,
  onSelect,
  exerciseName,
}: ScrollingTimerPickerProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to currently selected value
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector(
        `[data-seconds="${currentSeconds}"]`
      );
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, [isOpen, currentSeconds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm bg-card border border-border/80 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[75vh]">
        {/* Header */}
        <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Set Rest Duration
              </h3>
              {exerciseName && (
                <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                  {exerciseName}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable list with 15s intervals */}
        <div className="text-[11px] text-muted-foreground px-4 py-2 bg-secondary/10 border-b border-border/40 flex items-center justify-between">
          <span>Scroll to select interval (15s – 5:00)</span>
          <span className="font-mono text-blue-400 font-bold">
            Current: {formatIntervalLabel(currentSeconds)}
          </span>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-border/20 scrollbar-thin"
        >
          {TIMER_INTERVALS.map((seconds) => {
            const isSelected = currentSeconds === seconds;
            const tag = getScienceTag(seconds);

            return (
              <button
                key={seconds}
                data-seconds={seconds}
                type="button"
                onClick={() => {
                  onSelect(seconds);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all text-left ${
                  isSelected
                    ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"
                    : "hover:bg-secondary/70 text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-semibold">
                    {formatIntervalLabel(seconds)}
                  </span>
                  <span
                    className={`text-xs ${
                      isSelected ? "text-white/80" : "text-muted-foreground"
                    }`}
                  >
                    ({seconds} sec)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {tag && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {tag}
                    </span>
                  )}
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/60 bg-secondary/30 flex justify-between items-center">
          <span className="text-[11px] text-muted-foreground">
            Dr. Schoenfeld recommends 2-3 min for compounds
          </span>
          <Button
            size="sm"
            onClick={onClose}
            className="h-8 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
