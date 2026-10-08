"use client";

/**
 * SetRowInput — Single set row component for logging workouts.
 *
 * Responsibilities:
 * - Render individual set row inputs (weight/load and reps)
 * - Bind load and rep state handlers (onWeightChange, onRepsChange)
 * - Provide set completion toggle ("Done" / "Log")
 * - Provide set removal trigger
 */

import { Check, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface SetRowData {
  setNumber: number;
  reps: number;
  weight: number;
  completed?: boolean;
  isDone?: boolean;
  isCompleted?: boolean;
  unit?: string;
}

export interface SetRowInputProps {
  set: SetRowData;
  setIndex: number;
  unit: string;
  isOnlySet?: boolean;
  onWeightChange: (value: number) => void;
  onRepsChange: (value: number) => void;
  onToggleComplete: () => void;
  onRemove?: () => void;
}

export function SetRowInput({
  set,
  setIndex,
  unit,
  isOnlySet = false,
  onWeightChange,
  onRepsChange,
  onToggleComplete,
  onRemove,
}: SetRowInputProps) {
  const isDone = Boolean(set.completed || set.isDone || set.isCompleted);

  return (
    <div
      className={`grid grid-cols-[26px_1fr_1fr_64px_24px] gap-1.5 items-center p-1 rounded-lg transition-all ${
        isDone
          ? "bg-green-500/10 border border-green-500/30"
          : "bg-secondary/20 hover:bg-secondary/40 border border-transparent"
      }`}
      role="row"
      aria-label={`Set ${set.setNumber}`}
    >
      {/* Set number badge */}
      <div
        className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold ${
          isDone
            ? "bg-green-500/20 text-green-400"
            : "text-muted-foreground font-semibold"
        }`}
        aria-hidden="true"
      >
        {set.setNumber}
      </div>

      {/* Weight / Load input */}
      <Input
        id={`set-weight-${setIndex}`}
        type="number"
        min={0}
        step={0.5}
        value={set.weight || ""}
        onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
        placeholder="0"
        aria-label={`Set ${set.setNumber} weight in ${unit}`}
        className="bg-secondary/40 border-border/60 h-8 text-center font-bold text-xs rounded-md px-1"
      />

      {/* Reps input */}
      <Input
        id={`set-reps-${setIndex}`}
        type="number"
        min={0}
        value={set.reps || ""}
        onChange={(e) => onRepsChange(parseInt(e.target.value) || 0)}
        placeholder="0"
        aria-label={`Set ${set.setNumber} reps`}
        className="bg-secondary/40 border-border/60 h-8 text-center font-bold text-xs rounded-md px-1"
      />

      {/* Completion toggle */}
      <button
        type="button"
        onClick={onToggleComplete}
        aria-pressed={isDone}
        aria-label={
          isDone
            ? `Unmark set ${set.setNumber} as done`
            : `Mark set ${set.setNumber} as done`
        }
        className={`h-8 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-all ${
          isDone
            ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
            : "bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60"
        }`}
      >
        <Check className="w-3.5 h-3.5" />
        <span>{isDone ? "Done" : "Log"}</span>
      </button>

      {/* Remove set trigger */}
      <button
        type="button"
        onClick={onRemove}
        disabled={isOnlySet}
        aria-label={`Remove set ${set.setNumber}`}
        className="p-1 flex items-center justify-center text-muted-foreground/40 hover:text-destructive transition-colors disabled:opacity-0"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// Named alias for backwards compatibility
export const SetRow = SetRowInput;
export default SetRowInput;
