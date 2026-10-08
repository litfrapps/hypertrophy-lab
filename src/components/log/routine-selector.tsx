"use client";

/**
 * RoutineSelector — Saved routine cards, workout templates, and routine creation triggers.
 *
 * Responsibilities:
 * - Display user's saved routine cards with exercise tags and quick launch actions
 * - Provide curated, science-based workout templates (Push, Pull, Legs, Upper)
 * - Expose routine creation triggers (header CTA button, empty-state card)
 * - Provide edit and delete action triggers for custom routines
 */

import { useState } from "react";
import {
  Layers,
  Play,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Dumbbell,
  Flame,
} from "lucide-react";
import { exercises } from "@/lib/exercises";

export interface SavedRoutine {
  id: string;
  name: string;
  exerciseIds: string[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  tag: string;
  exerciseIds: string[];
}

export const DEFAULT_WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "tpl-push-hypertrophy",
    name: "Push Hypertrophy",
    description: "High mechanical tension for chest, anterior delts, and triceps.",
    tag: "Chest & Shoulders",
    exerciseIds: [
      "flat-barbell-bench-press",
      "incline-dumbbell-press",
      "lateral-raises",
      "tricep-pushdown",
    ],
  },
  {
    id: "tpl-pull-hypertrophy",
    name: "Pull Hypertrophy",
    description: "Complete back thickness, lat width, and elbow flexor loading.",
    tag: "Back & Biceps",
    exerciseIds: [
      "barbell-row",
      "lat-pulldown",
      "seated-cable-row",
      "barbell-curl",
    ],
  },
  {
    id: "tpl-legs-hypertrophy",
    name: "Legs Hypertrophy",
    description: "Quad stretch overload and posterior chain compound stimulus.",
    tag: "Quads & Glutes",
    exerciseIds: [
      "barbell-squat",
      "leg-press",
      "leg-extension",
      "deadlift",
    ],
  },
  {
    id: "tpl-upper-body",
    name: "Upper Body Hypertrophy",
    description: "Balanced compound pushing and pulling volume.",
    tag: "Full Upper",
    exerciseIds: [
      "incline-barbell-bench-press",
      "pull-ups",
      "overhead-press",
      "dumbbell-curl",
    ],
  },
];

export interface RoutineSelectorProps {
  routines: SavedRoutine[];
  onNewRoutine: () => void;
  onEditRoutine: (routine: SavedRoutine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onLaunchRoutine: (routine: SavedRoutine) => void;
  templates?: WorkoutTemplate[];
}

export function RoutineSelector({
  routines,
  onNewRoutine,
  onEditRoutine,
  onDeleteRoutine,
  onLaunchRoutine,
  templates = DEFAULT_WORKOUT_TEMPLATES,
}: RoutineSelectorProps) {
  const [activeTab, setActiveTab] = useState<"saved" | "templates">("saved");

  const launchTemplateAsRoutine = (tpl: WorkoutTemplate) => {
    onLaunchRoutine({
      id: tpl.id,
      name: tpl.name,
      exerciseIds: tpl.exerciseIds,
    });
  };

  return (
    <div className="space-y-3">
      {/* Section Header with Mode Tabs & Routine Creation Trigger */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 p-0.5 bg-secondary/50 rounded-lg border border-border/50">
          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              activeTab === "saved"
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>My Routines</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-400 font-mono font-bold">
              {routines.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              activeTab === "templates"
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Templates</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/10 text-cyan-400 font-mono font-bold">
              {templates.length}
            </span>
          </button>
        </div>

        {/* Routine Creation Trigger CTA */}
        <button
          type="button"
          id="new-routine-btn"
          onClick={onNewRoutine}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/20
                     hover:bg-purple-600/30 border border-purple-500/30 text-purple-300
                     text-[11px] font-semibold transition-all"
          aria-label="Create new routine"
        >
          <Plus className="w-3 h-3" />
          New Routine
        </button>
      </div>

      {/* Tab: Saved Routines */}
      {activeTab === "saved" && (
        <>
          {routines.length === 0 ? (
            /* Empty state creation trigger */
            <div
              onClick={onNewRoutine}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onNewRoutine()}
              className="cursor-pointer rounded-xl border border-dashed border-purple-500/30
                         bg-purple-500/5 hover:bg-purple-500/10 transition-all p-5 text-center
                         space-y-1.5 group"
              aria-label="Create your first routine"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                <Plus className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                Create your first routine
              </p>
              <p className="text-[11px] text-muted-foreground">
                Name it, pick exercises, and launch it in one tap anytime.
              </p>
            </div>
          ) : (
            /* Saved routine cards grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {routines.map((routine) => {
                const exNames = routine.exerciseIds
                  .map((id) => exercises.find((e) => e.id === id)?.name)
                  .filter(Boolean) as string[];

                return (
                  <div
                    key={routine.id}
                    className="rounded-xl border border-border/70 bg-card hover:border-purple-500/30
                               transition-all p-3 group flex flex-col gap-2"
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-purple-400 shrink-0" aria-hidden="true" />
                          <span className="text-xs font-bold text-foreground truncate">
                            {routine.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {exNames.length} {exNames.length === 1 ? "exercise" : "exercises"}
                        </p>
                      </div>

                      {/* Edit / Delete triggers */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditRoutine(routine)}
                          className="p-1 rounded text-muted-foreground/50 hover:text-blue-400 transition-colors"
                          title={`Edit ${routine.name}`}
                          aria-label={`Edit ${routine.name}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRoutine(routine.id)}
                          className="p-1 rounded text-muted-foreground/50 hover:text-destructive transition-colors"
                          title={`Delete ${routine.name}`}
                          aria-label={`Delete ${routine.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Exercise pills */}
                    <div className="flex flex-wrap gap-1" aria-label="Exercises in routine">
                      {exNames.slice(0, 4).map((name, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded-md bg-secondary/50 border border-border/40
                                     text-[10px] text-muted-foreground truncate max-w-[120px]"
                        >
                          {name}
                        </span>
                      ))}
                      {exNames.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-secondary/40 border border-border/30 text-[10px] text-muted-foreground">
                          +{exNames.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Launch trigger button */}
                    <button
                      type="button"
                      onClick={() => onLaunchRoutine(routine)}
                      className="w-full h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white
                                 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all mt-auto"
                      aria-label={`Launch ${routine.name}`}
                    >
                      <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                      Launch Routine
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab: Workout Templates */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-150">
          {templates.map((template) => {
            const exNames = template.exerciseIds
              .map((id) => exercises.find((e) => e.id === id)?.name)
              .filter(Boolean) as string[];

            return (
              <div
                key={template.id}
                className="rounded-xl border border-cyan-500/20 bg-card hover:border-cyan-500/40
                           transition-all p-3 flex flex-col gap-2 group relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="text-xs font-bold text-foreground truncate">
                        {template.name}
                      </span>
                    </div>
                    <span className="inline-block mt-0.5 text-[9px] font-semibold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400">
                      {template.tag}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                    {template.exerciseIds.length} exs
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {template.description}
                </p>

                {/* Exercise pills */}
                <div className="flex flex-wrap gap-1">
                  {exNames.map((name, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded-md bg-secondary/50 border border-border/40 text-[10px] text-muted-foreground truncate max-w-[120px]"
                    >
                      {name}
                    </span>
                  ))}
                </div>

                {/* Launch template trigger */}
                <button
                  type="button"
                  onClick={() => launchTemplateAsRoutine(template)}
                  className="w-full h-8 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white
                             text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all mt-auto shadow-sm"
                  aria-label={`Start ${template.name}`}
                >
                  <Dumbbell className="w-3 h-3" />
                  Launch Template
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RoutineSelector;
