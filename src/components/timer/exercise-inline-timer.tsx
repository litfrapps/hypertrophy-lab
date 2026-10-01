"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { playChimeSound } from "@/lib/sound";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  CheckCircle2,
  X,
  Volume2,
} from "lucide-react";

interface ExerciseInlineTimerProps {
  durationSeconds: number;
  isActive: boolean;
  onTimerEnd?: () => void;
  onDismiss?: () => void;
  exerciseName?: string;
}

export function ExerciseInlineTimer({
  durationSeconds,
  isActive,
  onTimerEnd,
  onDismiss,
  exerciseName,
}: ExerciseInlineTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(isActive);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync if duration changes or activated
  useEffect(() => {
    setTimeLeft(durationSeconds);
    setIsFinished(false);
    setIsRunning(isActive);
  }, [durationSeconds, isActive]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setIsFinished(true);
            playChimeSound();
            if (onTimerEnd) onTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, onTimerEnd]);

  const addTime = (secs: number) => {
    setTimeLeft((prev) => prev + secs);
    setIsFinished(false);
    setIsRunning(true);
  };

  const togglePause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(durationSeconds);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;

  const progressPercent =
    durationSeconds > 0
      ? ((durationSeconds - timeLeft) / durationSeconds) * 100
      : 0;

  if (!isActive && !isRunning && !isFinished) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all text-xs ${
        isFinished
          ? "bg-green-500/20 border-green-500/50 text-green-400 animate-pulse"
          : isRunning
          ? "bg-blue-950/40 border-blue-500/40 text-blue-400 shadow-sm shadow-blue-500/10"
          : "bg-secondary/60 border-border text-muted-foreground"
      }`}
    >
      {/* Mini SVG Progress Ring */}
      <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15"
            className="stroke-secondary"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            className={`transition-all duration-300 ${
              isFinished
                ? "stroke-green-400"
                : isRunning
                ? "stroke-blue-400"
                : "stroke-muted-foreground"
            }`}
            strokeWidth="4"
            strokeDasharray="94.25"
            strokeDashoffset={94.25 - (94.25 * progressPercent) / 100}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Countdown Time */}
      <div className="font-mono font-bold text-xs tracking-tight">
        {isFinished ? (
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Next Set!
          </span>
        ) : (
          <span>{timeFormatted}</span>
        )}
      </div>

      {/* Quick Controls */}
      <div className="flex items-center gap-0.5 ml-0.5">
        {!isFinished && (
          <>
            <button
              type="button"
              onClick={togglePause}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title={isRunning ? "Pause" : "Resume"}
            >
              {isRunning ? (
                <Pause className="w-3 h-3" />
              ) : (
                <Play className="w-3 h-3" />
              )}
            </button>
            <button
              type="button"
              onClick={() => addTime(15)}
              className="px-1 py-0.5 rounded hover:bg-secondary text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              title="+15 seconds"
            >
              +15s
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onDismiss || handleReset}
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Dismiss rest timer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
