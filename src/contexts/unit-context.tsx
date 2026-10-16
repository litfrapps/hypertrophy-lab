"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

import {
  type WeightUnit,
  KG_TO_LBS,
  LBS_TO_KG,
  convertWeight,
  formatWeight,
} from "@/lib/calculations";

export type { WeightUnit };
export { KG_TO_LBS, LBS_TO_KG, convertWeight, formatWeight };

export const UNIT_STORAGE_KEY = "hypertrophy-lab-unit";

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
          setTimeout(() => {
            setGlobalUnitState(saved);
          }, 0);
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
