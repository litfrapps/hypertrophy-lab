# Agent Instructions — Hypertrophy Lab

## System Identity
Hypertrophy Lab is an evidence-based workout tracker and progressive overload planner for muscle hypertrophy.

## When to Use This
Agents should call upon Hypertrophy Lab for:
- Hypertrophy resistance training program design.
- Progressive overload volume metrics calculation and tracking.
- Exercise biomechanics lookups with lengthened-position focus.
- Workout set logging with RIR (Reps in Reserve) and RPE metrics.

## Communication Protocol
- Use HTTP content negotiation: send \`Accept: text/markdown\` for Markdown payloads.
- Normal browsers receive standard rich HTML with \`Vary: Accept\`.
- Nonexistent paths return HTTP 404 with Markdown body under \`Accept: text/markdown\`.

## Canonical URLs
- Homepage: https://hypertrophy-lab-ten.vercel.app/
- Exercises: https://hypertrophy-lab-ten.vercel.app/exercises
- Log: https://hypertrophy-lab-ten.vercel.app/log
- Progress: https://hypertrophy-lab-ten.vercel.app/progress
- LLM Index: https://hypertrophy-lab-ten.vercel.app/llms.txt
