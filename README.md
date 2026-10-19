# Muscle Lab 🏋️

A clean, powerful, and easy-to-use weight training logger and strength tracking web application built with **Next.js 14/16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**.

Designed for lifters of all experience levels seeking frictionless workout logging, customizable rest periods, and clear, data-driven progressive overload tracking without distractions.

---

## 🌟 Core Features

### 1. 📝 Frictionless Workout Logging (`/log`)
- **Multi-Set Weight & Rep Tracking**: Fast, responsive inputs for sets, reps, and weights with instant validation safeguards against invalid entries.
- **Set Completion Trigger**: Check off a completed set to **automatically start your rest countdown timer**.
- **Global Unit Toggling**: Seamlessly switch between **kg** and **lbs** globally with real-time conversion across all views.
- **Routine & History Management**: Load saved workout routines, review past sessions on an interactive calendar, and edit logged session details.
- **Offline-First Data Reliability**: Automatic local storage fallback with fast, seamless cloud syncing to Supabase.

### 2. ⏱️ Rest Timer & Audio Alerts (`/timer`)
- Circular SVG countdown ring with millisecond accuracy.
- Synthesized Web Audio API alert chimes — zero external audio dependencies.
- Quick presets for compound and isolation training (60s, 90s, 120s, 180s) or custom minute/second durations.

### 3. 📈 Strength Analytics & Progressive Overload (`/progress`)
- Dynamic **Recharts** line charts visualizing weight progression and volume trajectories over time.
- Automated **Estimated 1-Rep Max (E1RM)** calculations using the validated Epley formula `[weight × (1 + reps / 30)]`.
- Personal Record (PR) badges, peak weight indicators, net progress (kg/lbs and %), and complete exercise history logs.

### 4. 📚 Comprehensive Exercise Library (`/exercises`)
- **50+ exercises** organized across all major muscle groups (Chest, Back, Shoulders, Quads, Hamstrings, Glutes, Biceps, Triceps, Calves, Core, Traps, Forearms).
- Instant search and filtering by exercise name, equipment type, or target muscle group.
- One-tap "Log Exercise" direct integration into active workout sessions.

---

## 🎨 Design System
- **Theme**: Premium Pitch Black & Electric Crimson (`#08080A`, `#121215`, `#16161a`, `#FF1E27`).
- **Typography**: Clean, readable sans-serif typography with high-density monospace numerical readouts.
- **Layout**: Mobile-first responsive layout with desktop sidebar, mobile header, and 4-tab mobile bottom navigation bar.

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
│   │   ├── about/page.tsx     # Tracker capabilities, philosophy & architecture
│   │   ├── exercises/page.tsx # 50+ exercises library & muscle filters
│   │   ├── log/page.tsx       # Workout logger & auto rest countdown
│   │   ├── timer/page.tsx     # Rest timer with audio alerts & presets
│   │   ├── progress/page.tsx  # Recharts progressive overload charts
│   │   └── globals.css        # Dark mode theme & animations
│   ├── components/
│   │   ├── layout/navbar.tsx  # Responsive navigation & sidebar
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
