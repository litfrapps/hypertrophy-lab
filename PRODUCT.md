# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

All gym-goers — beginners through advanced lifters — who want to track their workouts and progress. Beginners use it on day one; advanced lifters rely on the volume and progressive-overload detail. The app is used at the gym (mobile) and reviewed at a desk (desktop).

## Product Purpose

A focused hypertrophy workout tracker that is simple enough for a beginner's first session yet rich enough for a serious lifter's long-term data. Success means a user can log every set, watch their weights climb over time, and never lose a session to friction.

## Positioning

The app earns trust at both ends of experience: it does not condescend to beginners with stripped-down views, and it does not hide power features behind complexity. Science-backed rest presets, auto rest timers on set completion, and per-exercise progressive-overload charts are first-class — not add-ons.

## Operating Context

Used actively during training sessions (mobile, one hand, loud gym). Reviewed after sessions or between sets on desktop. Users may switch units (kg / lbs) globally. Sessions are synced to Supabase; Clerk handles authentication.

## Capabilities and Constraints

- **Exercise library**: 50+ exercises with primary/secondary muscle group tagging and 12 major muscle groups.
- **Workout logger**: multi-set logging (reps, weight, unit), auto-start rest timer on set completion, session volume calculation.
- **Rest timer**: circular SVG countdown, Web Audio API chime (no external files), science-backed presets (60 s / 90 s / 120 s / 180 s), custom duration input.
- **Progress tracking**: Recharts line/area charts, per-exercise load progression, PR badges, net-increase stats.
- **Unit system**: kg ↔ lbs toggle, global and per-set.
- **PWA**: offline-capable via @ducanh2912/next-pwa.
- **Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Supabase, Clerk Auth.
- **Persistence**: localStorage + Supabase cloud sync.
- Everything outside the above list may be redesigned or extended with permission.

## Brand Commitments

- **Color**: Dark Charcoal + Electric Crimson — `#08080a` background, `#FF1E27` primary accent. Non-negotiable.
- **Typography**: Orbitron (heading / display); Barlow Condensed (body). Non-negotiable.
- **Layout**: Mobile-first; bottom 4-tab navigation on mobile, sidebar on desktop.

## Evidence on Hand

- Source code in `src/` with full feature implementation.
- No real user testimonials, benchmarks, or press on hand; do not fabricate them.

## Product Principles

1. **Accessible depth** — the interface scales with the user's experience, never gatekeeping features behind complexity.
2. **Friction-free logging** — every tap in the gym must be deliberate and fast; reduce steps, not information.
3. **Data you can trust** — every stored number is the user's real effort; no rounding, no guessing.
4. **Science-informed defaults** — rest presets and volume guidance reflect hypertrophy research, not convention.
5. **Design as performance** — the aesthetic must feel as sharp as the users' training goals demand.
