"use client";

import { useState, useEffect, useRef } from "react";
import { playChimeSound } from "@/lib/sound";
import {
  Play,
  Pause,
  CheckCircle2,
  X,
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
}: ExerciseInlineTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(isActive);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync if duration changes or activated
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(durationSeconds);
      setIsFinished(false);
      setIsRunning(isActive);
    }, 0);
    return () => clearTimeout(timer);
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

  if (!isActive && !isRunning && !isFinished) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all text-xs ${
        isFinished
          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 animate-beacon-wave"
          : isRunning
          ? "bg-primary/10 border-primary/30 text-primary shadow-sm shadow-primary/5"
          : "bg-secondary/60 border-border text-muted-foreground"
      }`}
    >
      {/* Countdown Time / Status */}
      <div className="font-mono font-bold text-xs tracking-tight">
        {isFinished ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 animate-check-pop" /> Next Set!
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
