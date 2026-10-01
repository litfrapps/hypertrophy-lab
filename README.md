# Hypertrophy Lab 🧬🏋️

A scientifically-grounded hypertrophy workout tracking web application built with **Next.js 14/16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**.

Designed specifically for serious lifters seeking optimal muscle hypertrophy based on peer-reviewed research by **Dr. Brad Schoenfeld**, **Dr. Stuart Phillips**, **Alan Aragon**, and **Dr. Jozo Grgic**.

---

## 🌟 Core Features

### 1. 📚 Comprehensive Exercise Library (`/exercises`)
- **50+ exercises** with primary and secondary muscle group classifications (e.g. *Flat Barbell Bench Press* -> Main: Chest, Secondary: Triceps).
- Interactive search by exercise name, equipment, or target muscle group.
- Color-coded badges for all 12 major muscle groups (Chest, Back, Shoulders, Quads, Hamstrings, Glutes, Biceps, Triceps, Calves, Core, Traps, Forearms).
- Direct "Log Exercise" integration.

### 2. 📝 Workout Logger with Integrated Rest Timer (`/log`)
- Multi-set logger recording reps, working weights, and auto-calculating total session volume.
- **Set Completion Trigger**: Check off a completed set to **automatically start your rest countdown timer**.
- Toggle between **kg** and **lbs**.
- Automatic saving with local persistence (localStorage fallback + Supabase ready).

### 3. ⏱️ Customizable Rest Period Optimizer (`/timer`)
- Circular SVG progress ring with millisecond-accurate countdown.
- Synthesized Web Audio API alert chime — no external audio files required.
- **Science-Backed Presets**:
  - `60s`: Isolation / Calves
  - `90s`: Standard Hypertrophy
  - `120s`: Optimal metabolic recovery
  - `180s`: **Dr. Brad Schoenfeld (2016)** compound recommendation (2-3 min for maximal mechanical tension)
- Custom minute/second duration input.

### 4. 📈 Progressive Overload Graphical Tracking (`/progress`)
- Dynamic **Recharts** line & area visualization showing load progression over time (e.g. Squat 80kg → 90kg → 100kg).
- Exercise switcher to inspect progression for any movement.
- Personal Record (PR) badges, peak weight indicators, net increase (kg and %), and historical session records.

### 5. 🔬 Peer-Reviewed Science Hub (`/science`)
- Curated database of seminal sports science publications.
- Filter by topic: *Volume, Frequency, Intensity, Rest Periods, Rep Ranges, Training to Failure, Nutrition, Periodization*.
- Direct links to **PubMed** and official **DOI** sources.
- "Ask AI about this study" quick prompt launcher.

### 6. 🤖 Evidence-Based AI Training Coach (`/ai` & `/api/chat`)
- Grounded in exercise science literature.
- Structured answers with direct citations, author names, publication years, and PubMed links.
- Supports **Google Gemini API** (`GEMINI_API_KEY`) with an intelligent offline sports science fallback engine for zero-config testing.

---

## 🎨 Design System
- **Theme**: Premium Dark Navy & Slate (`#0b1120`, `#111827`, `#1a2332`).
- **Typography**: Inter (Google Fonts).
- **Accents**: Cyan (`#06b6d4`), Electric Blue (`#3b82f6`), Emerald (`#10b981`).
- **Layout**: Mobile-first responsive design with desktop sidebar, mobile header, and mobile bottom tab navigation.

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

# Google Gemini API (For live AI responses)
GEMINI_API_KEY=your-gemini-api-key-here

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
│   │   ├── page.tsx           # Dashboard with stats & quick actions
│   │   ├── exercises/page.tsx # 50+ exercises library & muscle filters
│   │   ├── log/page.tsx       # Workout logger & auto rest countdown
│   │   ├── timer/page.tsx     # Rest timer & Schoenfeld 2016 research
│   │   ├── progress/page.tsx  # Recharts progressive overload charts
│   │   ├── science/page.tsx   # Peer-reviewed research papers & PubMed
│   │   ├── ai/page.tsx        # Evidence-based AI Coach chat UI
│   │   ├── api/chat/route.ts  # AI backend with Gemini integration
│   │   └── globals.css        # Navy dark mode theme & animations
│   ├── components/
│   │   ├── layout/navbar.tsx  # Responsive navigation
│   │   ├── timer/rest-timer.tsx # Interactive rest timer widget
│   │   └── ui/                # 60+ shadcn components
│   ├── hooks/
│   │   └── use-workouts.ts    # Workout storage & aggregation hooks
│   ├── lib/
│   │   ├── exercises.ts       # Exercises database (primary/secondary tags)
│   │   ├── papers.ts          # Schoenfeld research papers database
│   │   ├── sound.ts           # Web Audio API chime generator
│   │   └── supabase.ts        # Supabase client connector
│   └── types/
│       └── index.ts           # TypeScript interfaces & types
└── public/
```
