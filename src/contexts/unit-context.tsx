"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export type WeightUnit = "kg" | "lbs";

export const UNIT_STORAGE_KEY = "hypertrophy-lab-unit";
export const KG_TO_LBS = 2.20462;
export const LBS_TO_KG = 0.453592;

/**
 * Converts a weight value between kg and lbs with 1 decimal place rounding
 * (or integer if decimal is 0).
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

export interface UnitContextValue {
  globalUnit: WeightUnit;
  setGlobalUnit: (unit: WeightUnit) => void;
  toggleGlobalUnit: (targetUnit?: WeightUnit) => void;
  convertWeight: (
    weight: number,
    fromUnit?: WeightUnit,
    toUnit?: WeightUnit
  ) => number;
  formatWeight: (
    weight: number,
    fromUnit?: WeightUnit,
    toUnit?: WeightUnit
  ) => string;
}

const UnitContext = createContext<UnitContextValue | null>(null);

export function UnitProvider({ children }: { children: ReactNode }) {
  const [globalUnit, setGlobalUnitState] = useState<WeightUnit>("kg");

  // Hydrate from localStorage on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(UNIT_STORAGE_KEY);
        if (saved === "kg" || saved === "lbs") {
          setGlobalUnitState(saved);
        }
      } catch (err) {
        console.warn("[UnitContext] Failed to read localStorage:", err);
      }
    }
  }, []);

  const setGlobalUnit = useCallback((newUnit: WeightUnit) => {
    setGlobalUnitState(newUnit);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(UNIT_STORAGE_KEY, newUnit);
      } catch (err) {
        console.warn("[UnitContext] Failed to write localStorage:", err);
      }
    }
  }, []);

  const toggleGlobalUnit = useCallback(
    (targetUnit?: WeightUnit) => {
      if (targetUnit) {
        setGlobalUnit(targetUnit);
      } else {
        setGlobalUnitState((prev) => {
          const next: WeightUnit = prev === "kg" ? "lbs" : "kg";
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(UNIT_STORAGE_KEY, next);
            } catch (err) {
              console.warn("[UnitContext] Failed to write localStorage:", err);
            }
          }
          return next;
        });
      }
    },
    [setGlobalUnit]
  );

  return (
    <UnitContext.Provider
      value={{
        globalUnit,
        setGlobalUnit,
        toggleGlobalUnit,
        convertWeight: (weight, fromUnit, toUnit) =>
          convertWeight(weight, fromUnit || "kg", toUnit || globalUnit),
        formatWeight: (weight, fromUnit, toUnit) =>
          formatWeight(weight, fromUnit || "kg", toUnit || globalUnit),
      }}
    >
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  const ctx = useContext(UnitContext);
  if (!ctx) {
    // Safe fallback if used outside UnitProvider
    return {
      globalUnit: "kg" as WeightUnit,
      setGlobalUnit: () => {},
      toggleGlobalUnit: () => {},
      convertWeight: (w: number, f?: WeightUnit, t?: WeightUnit) =>
        convertWeight(w, f || "kg", t || "kg"),
      formatWeight: (w: number, f?: WeightUnit, t?: WeightUnit) =>
        formatWeight(w, f || "kg", t || "kg"),
    };
  }
  return ctx;
}
