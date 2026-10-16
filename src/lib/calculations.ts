// ============================================
// Hypertrophy Lab — Core Calculations & Unit Utilities
// ============================================

export type WeightUnit = "kg" | "lbs";

export const KG_TO_LBS = 2.20462;
export const LBS_TO_KG = 0.453592;

/**
 * E1RM Utility — Epley Formula: Weight × (1 + Reps / 30)
 */
export function calculateE1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Converts a weight value between kg and lbs with 1 decimal place rounding.
 */
export function convertWeight(
  weight: number,
  fromUnit: WeightUnit = "kg",
  toUnit: WeightUnit = "kg"
): number {
  if (isNaN(weight) || weight <= 0) return 0;
  if (fromUnit === toUnit) return weight;

  const converted = fromUnit === "kg" ? weight * KG_TO_LBS : weight * LBS_TO_KG;
  return Math.round(converted * 10) / 10;
}

/**
 * Formats a weight value converted to targetUnit, stripping trailing zeros (.0)
 */
export function formatWeight(
  weight: number,
  fromUnit: WeightUnit = "kg",
  toUnit: WeightUnit = "kg"
): string {
  const converted = convertWeight(weight, fromUnit, toUnit);
  return Number.isInteger(converted) ? converted.toString() : converted.toFixed(1);
}
