"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { playChimeSound } from "@/lib/sound";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Bell,
  CheckCircle2,
  X,
  Volume2,
} from "lucide-react";

interface RestTimerProps {
  initialSeconds?: number;
  autoStart?: boolean;
  onFinish?: () => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  isFloating?: boolean;
}

const PRESET_DURATIONS = [
  { label: "60s (Quick)", seconds: 60, desc: "Isolation / Calves" },
  { label: "90s (Standard)", seconds: 90, desc: "Hypertrophy sweet spot" },
  { label: "120s (Optimal)", seconds: 120, desc: "High metabolic recovery" },
  { label: "180s (Science Rec)", seconds: 180, desc: "Schoenfeld 2016 compound study" },
];

export function RestTimer({
  initialSeconds = 90,
  autoStart = false,
  onFinish,
  onClose,
  title = "Rest Timer",
  subtitle = "Recover between sets for maximal mechanical tension",
  isFloating = false,
}: RestTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isFinished, setIsFinished] = useState(false);
  const [customInput, setCustomInput] = useState<string>("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync if initialSeconds change externally
  useEffect(() => {
    setTotalSeconds(initialSeconds);
    setTimeLeft(initialSeconds);
    setIsFinished(false);
    if (autoStart) {
      setIsRunning(true);
    }
  }, [initialSeconds, autoStart]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setIsFinished(true);
            playChimeSound();
            if (onFinish) onFinish();
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
  }, [isRunning, timeLeft, onFinish]);

  const handleStart = () => {
    if (timeLeft === 0) {
      setTimeLeft(totalSeconds);
      setIsFinished(false);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(totalSeconds);
  };

  const handleSelectPreset = (seconds: number) => {
    setTotalSeconds(seconds);
    setTimeLeft(seconds);
    setIsFinished(false);
    setIsRunning(true);
  };

  const addTime = (delta: number) => {
    setTimeLeft((prev) => Math.max(0, prev + delta));
    setTotalSeconds((prev) => Math.max(prev, timeLeft + delta));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const strokeDashoffset = 283 - (283 * (totalSeconds - timeLeft)) / totalSeconds;

  return (
    <Card
      className={`border-border bg-card shadow-2xl relative overflow-hidden ${
        isFloating
          ? "fixed bottom-20 right-4 z-50 w-80 sm:w-96 border-blue-500/30"
          : "w-full"
      }`}
    >
      {/* Top ambient glow when finished */}
      {isFinished && (
        <div className="absolute inset-0 bg-green-500/10 pointer-events-none animate-pulse" />
      )}

      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm tracking-tight">{title}</h3>
              <p className="text-[11px] text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={playChimeSound}
              title="Test audio chime"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onClose}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Circular Display */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-secondary"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className={`transition-all duration-300 ${
                  isFinished
                    ? "stroke-green-400"
                    : isRunning
                    ? "stroke-blue-500"
                    : "stroke-muted-foreground/40"
                }`}
                strokeWidth="7"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              {isFinished ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-green-400 animate-bounce mb-1" />
                  <span className="text-sm font-bold text-green-400">SET READY!</span>
                  <span className="text-[11px] text-muted-foreground">Time to lift</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-extrabold tracking-tighter font-mono">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {isRunning ? "Resting..." : timeLeft === totalSeconds ? "Ready" : "Paused"}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick adjust (+30s / -15s) */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addTime(-15)}
              disabled={timeLeft <= 15}
              className="h-8 text-xs border-border"
            >
              <Minus className="w-3 h-3 mr-1" /> 15s
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addTime(30)}
              className="h-8 text-xs border-border"
            >
              <Plus className="w-3 h-3 mr-1" /> 30s
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addTime(60)}
              className="h-8 text-xs border-border"
            >
              <Plus className="w-3 h-3 mr-1" /> 60s
            </Button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button
              onClick={handlePause}
              variant="secondary"
              className="flex-1 h-10 font-semibold"
            >
              <Pause className="w-4 h-4 mr-2" /> Pause
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              className="flex-1 h-10 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" /> {isFinished ? "Start Next Set" : "Start Timer"}
            </Button>
          )}

          <Button
            onClick={handleReset}
            variant="outline"
            className="h-10 border-border text-muted-foreground hover:text-foreground"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Presets */}
        <div className="space-y-1.5 pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Science-Backed Presets</span>
            <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
              Dr. Brad Schoenfeld
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_DURATIONS.map((preset) => (
              <button
                key={preset.seconds}
                onClick={() => handleSelectPreset(preset.seconds)}
                className={`p-2 rounded-lg text-left transition-all border text-xs ${
                  totalSeconds === preset.seconds
                    ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                    : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <div className="font-semibold">{preset.label}</div>
                <div className="text-[10px] text-muted-foreground opacity-80 truncate">
                  {preset.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
