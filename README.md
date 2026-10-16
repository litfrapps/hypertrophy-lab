# Hypertrophy Lab 🧬🏋️

A focused hypertrophy workout tracking web application built with **Next.js 14/16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**.

Designed specifically for serious lifters seeking optimal muscle hypertrophy through meticulous workout logging, customizable rest periods, and data-driven progressive overload tracking.

---

## 🌟 Core Features

### 1. 📚 Comprehensive Exercise Library (`/exercises`)
- **50+ exercises** with primary and secondary muscle group classifications (e.g. *Flat Barbell Bench Press* -> Main: Chest, Secondary: Triceps).
- Interactive search by exercise name, equipment, or target muscle group.
- Color-coded badges for all 12 major muscle groups (Chest, Back, Shoulders, Quads, Hamstrings, Glutes, Biceps, Triceps, Calves, Core, Traps, Forearms).
- Direct "Log Exercise" integration.

### 2. 📝 Core Workout Logger with Auto Rest Timer (`/log`)
- Multi-set logger recording reps, working weights, and auto-calculating total session volume.
- **Set Completion Trigger**: Check off a completed set to **automatically start your rest countdown timer**.
- **Global Unit Toggling**: Seamlessly switch between **kg** and **lbs** globally with real-time conversion.
- Session manager supporting routine loading, live elapsed duration timer, and local + Supabase persistence.

### 3. ⏱️ Customizable Rest Period Optimizer (`/timer`)
- Circular SVG progress ring with millisecond-accurate countdown.
- Synthesized Web Audio API alert chime — no external audio files required.
- **Science-Backed Presets**:
  - `60s`: Isolation / Calves
  - `90s`: Standard Hypertrophy
  - `120s`: Optimal metabolic recovery
  - `180s`: Compound lifts (2-3 min for maximal mechanical tension)
- Custom minute/second duration input and preset controls.

### 4. 📈 Progressive Overload Graphical Tracking (`/progress`)
- Dynamic **Recharts** line and area visualization displaying load progression over time (e.g. Squat 80kg → 90kg → 100kg).
- Exercise switcher to inspect volume and top set progression for any movement.
- Personal Record (PR) badges, peak weight indicators, net increase (kg and %), and historical session records.

---

## 🎨 Design System
- **Theme**: Premium Dark Charcoal & Electric Crimson (`#08080a`, `#121215`, `#16161a`, `#FF1E27`).
- **Typography**: Inter (Google Fonts) & high-density monospace figures.
- **Layout**: Mobile-first responsive design with desktop sidebar, mobile header, and 4-tab mobile bottom navigation bar.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)

### Development Server
```bash
cd hypertrophy-lab
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production
```bash
npm run build
npm start
```

---

## 🔑 Environment Setup (Optional)

Create a `.env.local` file in the `hypertrophy-lab/` directory using `.env.example`:

```env
# Supabase (When you are ready to connect your project)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Clerk Auth (When adding Clerk authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## 📁 Project Architecture

```
hypertrophy-lab/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Dark theme layout & desktop/mobile nav
│   │   ├── page.tsx           # Dashboard with stats, quick actions & sessions
│   │   ├── exercises/page.tsx # 50+ exercises library & muscle filters
│   │   ├── log/page.tsx       # Workout logger & auto rest countdown
│   │   ├── timer/page.tsx     # Rest timer with audio alerts & presets
│   │   ├── progress/page.tsx  # Recharts progressive overload charts
│   │   └── globals.css        # Dark mode theme & animations
│   ├── components/
│   │   ├── layout/navbar.tsx  # Responsive 4-tab navigation & sidebar
│   │   ├── timer/rest-timer.tsx # Interactive rest timer widget
│   │   └── ui/                # shadcn UI components
│   ├── hooks/
│   │   └── use-workouts.ts    # Workout storage & aggregation hooks
│   ├── lib/
│   │   ├── exercises.ts       # Exercises database (primary/secondary tags)
│   │   ├── sound.ts           # Web Audio API chime generator
│   │   └── supabase.ts        # Supabase client connector
│   └── types/
│       └── index.ts           # TypeScript interfaces & types
└── public/
```
