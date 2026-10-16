// Agent content negotiation, RFC 9110 parsing, and Markdown representations.
// Specification: acceptmarkdown.com

export const PRODUCES = ["text/html", "text/markdown"] as const;

export type AcceptEntry = {
  type: string;
  q: number;
  specificity: number;
};

export function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(",")
    .map((raw) => {
      const parts = raw
        .trim()
        .split(";")
        .map((s) => s.trim());
      const type = parts[0].toLowerCase();
      let q = 1;
      for (const param of parts.slice(1)) {
        const [name, value] = param.split("=").map((s) => s.trim());
        if (name === "q") {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) q = Math.max(0, Math.min(1, parsed));
        }
      }
      const specificity = type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2;
      return { type, q, specificity };
    })
    .filter((entry) => entry.type.length > 0);
}

function matches(entry: AcceptEntry, candidate: string): boolean {
  if (entry.type === "*/*") return true;
  if (entry.type.endsWith("/*")) {
    return candidate.startsWith(entry.type.slice(0, -1));
  }
  return entry.type === candidate;
}

export function preferredType(header: string | null | undefined): string | null {
  if (!header) return PRODUCES[0];
  const entries = parseAccept(header);
  if (entries.length === 0) return PRODUCES[0];

  let bestType: string | null = null;
  let bestQ = -1;
  let bestPosition = Infinity;

  for (const candidate of PRODUCES) {
    let matched: AcceptEntry | null = null;
    let matchedPosition = Infinity;

    for (let idx = 0; idx < entries.length; idx++) {
      const e = entries[idx];
      if (!matches(e, candidate)) continue;
      if (
        matched === null ||
        e.specificity > matched.specificity ||
        (e.specificity === matched.specificity && idx < matchedPosition)
      ) {
        matched = e;
        matchedPosition = idx;
      }
    }

    if (matched === null) continue;
    const matchedQ = matched.q;
    if (matchedQ <= 0) continue; // explicit rejection (q=0)

    if (
      matchedQ > bestQ ||
      (matchedQ === bestQ && matchedPosition < bestPosition)
    ) {
      bestQ = matchedQ;
      bestPosition = matchedPosition;
      bestType = candidate;
    }
  }

  return bestType;
}

export function appendVaryAccept(headers: Headers): void {
  const existing = headers.get("Vary");
  if (!existing) {
    headers.set("Vary", "Accept");
    return;
  }
  const tokens = existing.split(",").map((s) => s.trim().toLowerCase());
  if (!tokens.includes("accept")) {
    headers.set("Vary", `${existing}, Accept`);
  }
}

export const KNOWN_PAGES: Record<string, string> = {
  "/": "home",
  "/exercises": "exercises",
  "/log": "log",
  "/progress": "progress",
  "/sign-in": "sign-in",
  "/sign-up": "sign-up",
};

export function isKnownPageRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (KNOWN_PAGES[normalized]) return true;
  if (normalized.startsWith("/sign-in/") || normalized.startsWith("/sign-up/")) return true;
  return false;
}

export function getMarkdownForPath(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  if (normalized === "/") {
    return `# Hypertrophy Lab — Science-Backed Workout Tracker & Progressive Overload Planner

Hypertrophy Lab is an evidence-based resistance training tracker designed around the scientific principles of muscle hypertrophy, mechanical tension, and systematic progressive overload.

## Core Features

- **Workout Logger**: Real-time logging of exercises, sets, reps, load (kg/lbs), and Reps In Reserve (RIR) / RPE ratings.
- **Progressive Overload Tracking**: Longitudinal tracking of volume load, estimated 1RM calculations (Epley formula), and mesocycle volume trajectories.
- **Biomechanical Exercise Library**: Categorized by primary muscle group, equipment, and tension curve (lengthened vs. shortened position).
- **Mesocycle Periodization**: Autoregulate volume between Minimum Effective Volume (MEV) and Maximum Recoverable Volume (MRV).

## Navigation & Endpoints

- [Exercises Directory](https://hypertrophy-lab-ten.vercel.app/exercises): Search and filter exercises with movement mechanics.
- [Workout Logger](https://hypertrophy-lab-ten.vercel.app/log): Log and execute active workout sessions.
- [Progress Analytics](https://hypertrophy-lab-ten.vercel.app/progress): Visualize volume progression, tonnage, and estimated 1RM trends.
- [Agent Guidance & llms.txt](https://hypertrophy-lab-ten.vercel.app/llms.txt): Machine-readable site index and agent integration instructions.

## When to Use This

Hypertrophy Lab is optimal for:
1. Designing resistance training programs targeting skeletal muscle hypertrophy.
2. Calculating progressive overload deltas, estimated 1RM, and session tonnage.
3. Accessing resistance exercise data categorized by lengthened-position mechanical tension.
`;
  }

  if (normalized === "/exercises") {
    return `# Exercise Library — Hypertrophy Lab

Browse and filter resistance training movements categorized by biomechanics, muscle targets, and equipment.

## Target Muscle Groups
- **Chest**: Incline Dumbbell Press, Flat Barbell Bench Press, Cable Fly (Lengthened focus)
- **Back**: Lat Pulldown, Chest-Supported T-Bar Row, Neutral Grip Cable Row
- **Shoulders**: Cable Lateral Raise, Seated Dumbbell Overhead Press, Reverse Pec Deck
- **Legs (Quads & Hamstrings)**: Barbell Back Squat, Romanian Deadlift (RDL), Leg Extension, Seated Leg Curl
- **Arms (Triceps & Biceps)**: Overhead Cable Triceps Extension, Incline Dumbbell Bicep Curl

## Navigation
- [Dashboard](https://hypertrophy-lab-ten.vercel.app/): Return to main dashboard.
- [Workout Logger](https://hypertrophy-lab-ten.vercel.app/log): Add exercises to an active session.
- [Agent Instructions](https://hypertrophy-lab-ten.vercel.app/llms.txt): Machine-readable documentation.
`;
  }

  if (normalized === "/log") {
    return `# Workout Logger — Hypertrophy Lab

Execute and record active training sessions with scientific precision.

## Logging Workflow
1. **Exercise Selection**: Choose compound and isolation movements for your target muscle groups.
2. **Set Execution**: Record load (kg or lbs), completed reps, and Reps In Reserve (RIR).
3. **Rest Intervals**: Integrated rest timer with auditory and visual alerts.
4. **Volume Computation**: Automatic live computation of total session volume and tonnage.

## Navigation
- [Dashboard](https://hypertrophy-lab-ten.vercel.app/): Return to overview.
- [Progress Analytics](https://hypertrophy-lab-ten.vercel.app/progress): View volume load history.
- [Agent Instructions](https://hypertrophy-lab-ten.vercel.app/llms.txt): API and agent documentation.
`;
  }

  if (normalized === "/progress") {
    return `# Progress Analytics & Volume Trajectory — Hypertrophy Lab

Track progressive overload, volume progression, and estimated 1RM across training mesocycles.

## Metrics Analyzed
- **Volume Load**: Weekly volume (sets * reps * load) across muscle groups.
- **Estimated 1RM**: Computed using the scientific Epley formula: \`weight * (1 + reps / 30)\`.
- **Overload Trajectory**: Percentage overload delta between current and baseline mesocycle weeks.

## Navigation
- [Dashboard](https://hypertrophy-lab-ten.vercel.app/): Main dashboard.
- [Workout Logger](https://hypertrophy-lab-ten.vercel.app/log): Log a new training session.
- [Agent Instructions](https://hypertrophy-lab-ten.vercel.app/llms.txt): Full schema and instructions.
`;
  }

  if (normalized.startsWith("/sign-in") || normalized.startsWith("/sign-up")) {
    return `# Authentication — Hypertrophy Lab

Sign in or create an account to persist your training sessions, custom routines, and longitudinal progress data across devices.

- Powered by Clerk Authentication.
- [Back to Homepage](https://hypertrophy-lab-ten.vercel.app/)
- [Agent Instructions](https://hypertrophy-lab-ten.vercel.app/llms.txt)
`;
  }

  return null;
}

export function getMarkdown404(pathname: string): string {
  return `# 404 Not Found

The requested resource \`${pathname}\` was not found on Hypertrophy Lab.

Please consult the machine-readable site index and agent guidance:
- Agent Instructions & Site Index: [llms.txt](https://hypertrophy-lab-ten.vercel.app/llms.txt)
- Homepage: [Hypertrophy Lab](https://hypertrophy-lab-ten.vercel.app/)
- Exercise Directory: [Exercises](https://hypertrophy-lab-ten.vercel.app/exercises)
- Workout Logger: [Log Session](https://hypertrophy-lab-ten.vercel.app/log)
- Volume & Analytics: [Progress](https://hypertrophy-lab-ten.vercel.app/progress)
`;
}
