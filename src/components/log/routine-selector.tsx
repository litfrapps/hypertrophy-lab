"use client";

/**
 * RoutineSelector — Saved routine cards and routine creation triggers.
 *
 * Responsibilities:
 * - Display user's saved routine cards with exercise tags and quick launch actions
 * - Expose routine creation triggers (header CTA button, empty-state card)
 * - Provide edit and delete action triggers for custom routines
 */

import {
  Layers,
  Play,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { exercises } from "@/lib/exercises";

export interface SavedRoutine {
  id: string;
  name: string;
  exerciseIds: string[];
}

export interface RoutineSelectorProps {
  routines: SavedRoutine[];
  onNewRoutine: () => void;
  onEditRoutine: (routine: SavedRoutine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onLaunchRoutine: (routine: SavedRoutine) => void;
}

export function RoutineSelector({
  routines,
  onNewRoutine,
  onEditRoutine,
  onDeleteRoutine,
  onLaunchRoutine,
}: RoutineSelectorProps) {
  return (
    <div className="space-y-2.5">
      {/* Section Header with Title & Routine Creation Trigger */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <h2 className="text-xs sm:text-sm font-bold text-foreground">
            My Routines
          </h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-950/40 border border-red-900/30 text-primary font-mono font-bold">
            {routines.length}
          </span>
        </div>

        {/* Routine Creation Trigger CTA */}
        <button
          type="button"
          id="new-routine-btn"
          onClick={onNewRoutine}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/40
                     hover:bg-primary/20 border border-primary/30 text-red-200 hover:text-white
                     text-[11px] font-semibold transition-all cursor-pointer"
          aria-label="Create new routine"
        >
          <Plus className="w-3 h-3 text-primary" />
          New Routine
        </button>
      </div>

      {/* Saved Routines */}
      {routines.length === 0 ? (
        /* Empty state creation trigger */
        <div
          onClick={onNewRoutine}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNewRoutine()}
          className="cursor-pointer rounded-xl border border-dashed border-red-900/40
                     bg-red-950/15 hover:bg-red-950/25 hover:border-primary/40 transition-all p-3.5 text-center
                     space-y-1 group"
          aria-label="Create your first routine"
        >
          <div className="w-7 h-7 rounded-lg bg-red-950/50 border border-primary/20 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
            <Plus className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-xs font-semibold text-foreground">
            Create your first routine
          </p>
          <p className="text-[10px] text-muted-foreground">
            Name it, pick exercises, and launch it in one tap anytime.
          </p>
        </div>
      ) : (
        /* Saved routine cards grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {routines.map((routine) => {
            const exNames = routine.exerciseIds
              .map((id) => exercises.find((e) => e.id === id)?.name)
              .filter(Boolean) as string[];

            return (
              <div
                key={routine.id}
                className="rounded-xl border border-border/70 bg-[#121215] hover:border-primary/40 hover:bg-[#16161a]
                           transition-all p-2.5 sm:p-3 group flex flex-col gap-2"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
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
                      className="p-1 rounded text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer"
                      title={`Edit ${routine.name}`}
                      aria-label={`Edit ${routine.name}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRoutine(routine.id)}
                      className="p-1 rounded text-muted-foreground/60 hover:text-destructive transition-colors cursor-pointer"
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
                      className="px-1.5 py-0.5 rounded-md bg-[#16161a] border border-border/50
                                 text-[10px] text-muted-foreground truncate max-w-[120px]"
                    >
                      {name}
                    </span>
                  ))}
                  {exNames.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#16161a] border border-border/40 text-[10px] text-muted-foreground">
                      +{exNames.length - 4} more
                    </span>
                  )}
                </div>

                {/* Launch trigger button */}
                <button
                  type="button"
                  onClick={() => onLaunchRoutine(routine)}
                  className="w-full h-8 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20
                             text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all mt-auto cursor-pointer"
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
    </div>
  );
}

export default RoutineSelector;
