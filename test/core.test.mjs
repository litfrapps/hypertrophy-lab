import test from "node:test";
import assert from "node:assert/strict";

// Core calculation logic extracted directly from unit-context and use-workouts
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

function calculateE1RM(weight, reps) {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

function convertWeight(weight, fromUnit = "kg", toUnit = "kg") {
  if (isNaN(weight) || weight <= 0) return 0;
  if (fromUnit === toUnit) return weight;
  const converted = fromUnit === "kg" ? weight * KG_TO_LBS : weight * LBS_TO_KG;
  return Math.round(converted * 10) / 10;
}

function formatWeight(weight, fromUnit = "kg", toUnit = "kg") {
  const converted = convertWeight(weight, fromUnit, toUnit);
  return Number.isInteger(converted) ? converted.toString() : converted.toFixed(1);
}

test("calculateE1RM - 1 rep returns exact weight", () => {
  assert.equal(calculateE1RM(100, 1), 100);
});

test("calculateE1RM - handles standard Epley calculation", () => {
  // 100 * (1 + 10 / 30) = 133.333 -> 133.3
  assert.equal(calculateE1RM(100, 10), 133.3);
});

test("calculateE1RM - edge cases (zero or negative weight/reps)", () => {
  assert.equal(calculateE1RM(0, 10), 0);
  assert.equal(calculateE1RM(100, 0), 0);
  assert.equal(calculateE1RM(-50, 5), 0);
});

test("convertWeight - identical units require no conversion", () => {
  assert.equal(convertWeight(100, "kg", "kg"), 100);
  assert.equal(convertWeight(220, "lbs", "lbs"), 220);
});

test("convertWeight - kg to lbs and lbs to kg", () => {
  assert.equal(convertWeight(100, "kg", "lbs"), 220.5);
  assert.equal(convertWeight(220.5, "lbs", "kg"), 100);
});

test("formatWeight - strips trailing .0 for integer results", () => {
  assert.equal(formatWeight(100, "kg", "kg"), "100");
  assert.equal(formatWeight(100, "kg", "lbs"), "220.5");
});
