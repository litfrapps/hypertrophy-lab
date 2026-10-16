"use client";

/**
 * SetRowInput — Single set row component for logging workouts.
 *
 * Responsibilities:
 * - Render individual set row inputs (weight/load and reps)
 * - Bind load and rep state handlers (onWeightChange, onRepsChange)
 * - Provide set completion toggle ("Done" / "Log")
 * - Provide full-row swipe-to-delete gesture via Framer Motion with drag reset & exit animations
 */

import { useState, useEffect } from "react";
import { Check, Trash2 } from "lucide-react";
import { motion, useMotionValue, animate, type PanInfo } from "framer-motion";
import { Input } from "@/components/ui/input";

export interface SetRowData {
  id?: string;
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
  onDeleteSet?: (index: number) => void;
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
  onDeleteSet,
}: SetRowInputProps) {
  const isDone = Boolean(set.completed || set.isDone || set.isCompleted);
  const x = useMotionValue(0);
  const [isPastThreshold, setIsPastThreshold] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const unsubscribe = x.on("change", (latest) => {
      setIsPastThreshold(latest <= -70);
      setIsRevealed(latest < 0);
    });
    return () => unsubscribe();
  }, [x]);

  const handleDelete = () => {
    if (isOnlySet) return;
    // Reset motion position prior to invoking onDeleteSet callback as required
    x.set(0);
    if (onDeleteSet) {
      onDeleteSet(setIndex);
    } else if (onRemove) {
      onRemove();
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isOnlySet) {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
      return;
    }

    if (info.offset.x <= -70 || x.get() <= -70) {
      handleDelete();
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  return (
    <motion.div
      layout
      exit={{ opacity: 0, height: 0, x: -200 }}
      transition={{
        opacity: { duration: 0.15 },
        height: { duration: 0.2 },
        x: { duration: 0.2 },
        layout: { duration: 0.2 },
      }}
      className="relative overflow-hidden rounded-lg w-full select-none touch-pan-y"
    >
      {/* Underlying delete action strip */}
      <div
        className={`absolute inset-0 rounded-lg flex items-center justify-end px-3.5 transition-colors duration-150 cursor-pointer ${
          isPastThreshold
            ? "bg-[#ff1e27] text-white shadow-[inset_0_0_12px_rgba(0,0,0,0.4)]"
            : "bg-[#2b0a0c] border border-[#ff1e27]/30 text-[#ff444c]"
        }`}
        style={{
          opacity: isRevealed ? 1 : 0,
        }}
        onClick={handleDelete}
        aria-hidden="true"
      >
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <Trash2
            className={`w-4 h-4 transition-transform duration-150 ${
              isPastThreshold ? "scale-110 text-white" : "text-[#ff444c]"
            }`}
          />
          <span className="text-[10px] uppercase tracking-wider font-mono font-semibold">
            {isPastThreshold ? "Delete" : "Swipe"}
          </span>
        </div>
      </div>

      {/* Foreground draggable set row */}
      <motion.div
        style={{ x }}
        drag={isOnlySet ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.05 }}
        onDragEnd={handleDragEnd}
        className={`relative grid grid-cols-[26px_1fr_1fr_64px] gap-1.5 items-center p-1 rounded-lg bg-card transition-colors ${
          isDone
            ? "bg-green-500/10 border border-green-500/30"
            : "bg-secondary/30 hover:bg-secondary/50 border border-border/40"
        } touch-pan-y cursor-grab active:cursor-grabbing`}
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
          className="bg-secondary/40 border-border/60 h-8 text-center font-bold text-xs rounded-md px-1 touch-pan-y"
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
          className="bg-secondary/40 border-border/60 h-8 text-center font-bold text-xs rounded-md px-1 touch-pan-y"
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
          className={`h-8 rounded-md text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all duration-150 ${
            isDone
              ? "bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-500/20"
              : "bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60"
          }`}
        >
          <Check className={`w-3.5 h-3.5 ${isDone ? "animate-check-pop" : ""}`} />
          <span>{isDone ? "Done" : "Log"}</span>
        </button>
      </motion.div>
    </motion.div>
  );
}

// Named alias for backwards compatibility
export const SetRow = SetRowInput;
export default SetRowInput;
