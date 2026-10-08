"use client";

/**
 * WorkoutCalendar — Interactive date calendar and day-specific session cards.
 *
 * Responsibilities:
 * - Interactive month calendar with indicators for days with logged workouts
 * - Day selection to inspect day-specific workout session cards
 * - Actions for editing session date/time and requesting session deletion
 * - Selection triggers for detailed session dialog inspection
 */

import { useState, useMemo } from "react";
import { WorkoutSession } from "@/types";
import { useUnit } from "@/contexts/unit-context";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Calendar as CalendarIcon,
  Edit2,
  Trash2,
  ChevronRight,
  X,
} from "lucide-react";

function formatSessionTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const p = (n: number) => n.toString().padStart(2, "0");
  return hrs > 0 ? `${p(hrs)}:${p(mins)}:${p(secs)}` : `${p(mins)}:${p(secs)}`;
}

export interface WorkoutCalendarProps {
  sessions: WorkoutSession[];
  onEditDate: (session: WorkoutSession) => void;
  onDeleteRequest: (session: WorkoutSession) => void;
  onSelectSession: (sessionId: string) => void;
}

export function WorkoutCalendar({
  sessions,
  onEditDate,
  onDeleteRequest,
  onSelectSession,
}: WorkoutCalendarProps) {
  const { globalUnit, convertWeight } = useUnit();
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const sessionsByDate = useMemo<Record<string, WorkoutSession[]>>(() => {
    const map: Record<string, WorkoutSession[]> = {};
    for (const s of sessions) {
      const d = new Date(s.date);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return map;
  }, [sessions]);

  const workoutDays = useMemo(
    () => Object.keys(sessionsByDate).map((k) => new Date(k + "T00:00:00")),
    [sessionsByDate]
  );

  const selectedDateKey = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : null;

  const selectedSessions = selectedDateKey ? (sessionsByDate[selectedDateKey] ?? []) : [];

  return (
    <div className="space-y-3">
      {sessions.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card p-6 text-center space-y-2">
          <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <div className="text-xs font-semibold text-foreground">No sessions logged yet</div>
          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
            Start a session above. Completed sessions will appear here with calendar indicators.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(day) => {
                if (!day) {
                  setSelectedDate(undefined);
                  return;
                }
                if (selectedDate && selectedDate.toDateString() === day.toDateString()) {
                  setSelectedDate(undefined);
                } else {
                  setSelectedDate(day);
                }
              }}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              modifiers={{ workout: workoutDays }}
              modifiersClassNames={{ workout: "relative" }}
              components={{
                DayButton: ({ day, modifiers, ...props }) => {
                  const d = day.date;
                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  const hasWorkout = !!sessionsByDate[key];
                  const count = sessionsByDate[key]?.length ?? 0;
                  const isSelected = selectedDate?.toDateString() === d.toDateString();
                  return (
                    <button
                      {...props}
                      className={[
                        props.className,
                        "relative flex flex-col items-center justify-center w-full h-full rounded-md transition-colors",
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : hasWorkout
                            ? "hover:bg-emerald-500/10 text-foreground font-semibold"
                            : "hover:bg-secondary/60 text-foreground",
                        modifiers.today && !isSelected ? "ring-1 ring-blue-400/60" : "",
                        modifiers.outside ? "opacity-30" : "",
                      ].filter(Boolean).join(" ")}
                    >
                      <span className="text-[13px] leading-none">{d.getDate()}</span>
                      {hasWorkout && (
                        <span className={`mt-0.5 flex gap-px ${isSelected ? "opacity-90" : ""}`}>
                          {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                            <span
                              key={i}
                              className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/80" : "bg-emerald-400"}`}
                            />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                },
              }}
              className="w-full [--cell-size:--spacing(10)]"
            />
            <div className="px-3 pb-3 flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border/30 pt-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Workout logged
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded ring-1 ring-blue-400/60 inline-block" />
                Today
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                Selected
              </span>
            </div>
          </div>

          {selectedDate && (
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3.5 py-2.5 border-b border-border/40 bg-secondary/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-foreground">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                    {selectedSessions.length} {selectedSessions.length === 1 ? "session" : "sessions"}
                  </span>
                  <button
                    onClick={() => setSelectedDate(undefined)}
                    className="p-1 rounded text-muted-foreground/50 hover:text-foreground transition-colors"
                    aria-label="Close date panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {selectedSessions.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No workouts logged on this day.
                </div>
              ) : (
                <div className="p-3 space-y-2.5">
                  {selectedSessions.map((session, idx) => {
                    const sessionDate = new Date(session.date);
                    const timeStr = !isNaN(sessionDate.getTime())
                      ? sessionDate.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : null;
                    const totalSets = session.logs.reduce((s, l) => s + l.sets.length, 0);
                    const totalVol = session.logs.reduce(
                      (s, l) =>
                        s +
                        l.sets.reduce(
                          (ss, set) =>
                            ss +
                            set.reps *
                              convertWeight(set.weight, set.unit || l.unit || "kg", globalUnit),
                          0
                        ),
                      0
                    );

                    return (
                      <div
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className="group relative p-3 space-y-2 rounded-xl border border-border/40 bg-card/60 hover:bg-secondary/20 cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-mono font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            {timeStr && (
                              <span className="text-foreground font-semibold">{timeStr}</span>
                            )}
                            {session.durationSeconds && session.durationSeconds > 0 && (
                              <span className="text-muted-foreground flex items-center gap-0.5">
                                <Clock className="w-3 h-3 text-cyan-400" />
                                {formatSessionTime(session.durationSeconds)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditDate(session);
                              }}
                              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10"
                              title="Adjust date/time"
                            >
                              <Edit2 className="w-2.5 h-2.5 mr-0.5" /> Date
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRequest(session);
                              }}
                              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Delete session"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            <div className="p-1 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {session.logs.map((log) => {
                            const maxWt =
                              log.sets.length > 0
                                ? Math.max(
                                    ...log.sets.map((s) =>
                                      convertWeight(s.weight, s.unit || log.unit || "kg", globalUnit)
                                    )
                                  )
                                : 0;
                            return (
                              <div
                                key={log.id}
                                className="px-2 py-0.5 rounded-md bg-secondary/40 border border-border/40 text-[10px] font-medium flex items-center gap-1.5"
                              >
                                <span className="font-semibold truncate max-w-[110px]">
                                  {log.exerciseName}
                                </span>
                                <span className="text-muted-foreground">
                                  {log.sets.length}s
                                </span>
                                <span className="font-mono text-blue-400 font-bold">
                                  {maxWt} {globalUnit}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/20">
                          <span>
                            {session.logs.length}{" "}
                            {session.logs.length === 1 ? "exercise" : "exercises"} ·{" "}
                            {totalSets} sets
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            {Math.round(totalVol).toLocaleString()} {globalUnit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default WorkoutCalendar;
