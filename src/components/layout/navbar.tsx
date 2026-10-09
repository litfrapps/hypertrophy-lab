"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  ClipboardList,
  Dumbbell,
  BookOpen,
  LineChart,
  Bot,
  Menu,
  X,
  LogIn,
  UserPlus,
  Clock,
  Zap,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { useSession } from "@/contexts/session-context";
import { useUnit } from "@/contexts/unit-context";
import { FloatingBanner } from "@/components/log/floating-banner";

// Stylized Electric Crimson "M" brand mark for Muscle Lab
export function MuscleLabBrandMark({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Muscle Lab logo"
    >
      <path
        d="M3 4.5h4.4l4.6 10.5 4.6-10.5H21v19h-4.2v-11l-3.8 8.8h-2L7.2 12.5v11H3V4.5z"
        fill="#FF1E27"
      />
    </svg>
  );
}

// 5 Primary Mobile Bottom Tabs
const mobileBottomTabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/log", label: "Log", icon: ClipboardList },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/science", label: "Research", icon: BookOpen },
];

// Desktop / Full Drawer Navigation Items
const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/log", label: "Log Workout", icon: ClipboardList },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/science", label: "Research", icon: BookOpen },
  { href: "/ai", label: "AI Coach", icon: Bot },
];

function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${p(h)}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const {
    isActive,
    elapsedSeconds,
    exercises: sessionExercises,
    liveVolume,
  } = useSession();
  const { globalUnit, toggleGlobalUnit } = useUnit();

  // Only show the floating banner when a session is active and NOT on /log
  const showSessionBanner = isActive && pathname !== "/log";

  return (
    <>
      {/* ─── DESKTOP SIDEBAR (lg:breakpoint) ─────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 flex-col border-r border-[#222226] bg-[#121215] z-50">
        {/* Brand Header */}
        <Link
          href="/"
          className="flex items-center gap-2.5 px-4.5 py-4 border-b border-[#222226] hover:bg-[#16161a]/60 transition-colors group"
        >
          <div className="relative flex items-center justify-center w-8.5 h-8.5 rounded-lg bg-[#2B0A0C] border border-[#FF1E27]/30 shadow-md shadow-[#FF1E27]/10 group-hover:border-[#FF1E27]/60 transition-all">
            <MuscleLabBrandMark className="w-5 h-5 text-[#FF1E27]" />
          </div>
          <div>
            <h1 className="font-display font-black text-xs tracking-[0.2em] text-white">
              MUSCLE LAB
            </h1>
            <p className="text-[9px] text-[#888890] tracking-widest uppercase font-medium">
              HYPERTROPHY
            </p>
          </div>
        </Link>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isNavActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150",
                  isNavActive
                    ? "bg-[#2B0A0C] text-[#FF1E27] border-l-2 border-[#FF1E27] shadow-sm shadow-[#FF1E27]/10"
                    : "text-[#888890] hover:text-white hover:bg-[#16161a]"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isNavActive ? "text-[#FF1E27]" : "text-[#888890]"
                  )}
                />
                <span className={cn(isNavActive && "font-bold text-white")}>
                  {item.label}
                </span>
                {isNavActive && (
                  <div className="ml-auto w-1 h-1 rounded-full bg-[#FF1E27] shadow-sm shadow-[#FF1E27]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Active Session Desktop Notification Banner */}
        {showSessionBanner && (
          <div className="px-2.5 py-2 border-t border-[#222226]">
            <Link href="/log" className="block">
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#2B0A0C]/70 border border-[#FF1E27]/40 hover:border-[#FF1E27]/70 transition-all group cursor-pointer shadow-sm shadow-[#FF1E27]/10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF1E27] animate-pulse shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[#FF1E27] shrink-0" />
                    <span className="text-xs font-bold font-mono text-[#FF1E27]">
                      {fmtTime(elapsedSeconds)}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#888890] truncate mt-0.5">
                    {sessionExercises.length}{" "}
                    {sessionExercises.length === 1 ? "exercise" : "exercises"}
                    {liveVolume > 0 &&
                      ` · ${liveVolume.toLocaleString()} ${globalUnit}`}
                  </p>
                </div>
                <Zap className="w-3 h-3 text-[#FF1E27] group-hover:scale-110 transition-transform shrink-0" />
              </div>
            </Link>
          </div>
        )}

        {/* Global Weight Unit Setting Row */}
        <div className="px-3 py-2 border-t border-[#222226]">
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#16161a] border border-[#222226]">
            <div className="flex items-center gap-1.5">
              <Scale className="w-3 h-3 text-[#FF1E27]" />
              <span className="text-[11px] font-semibold text-white">Unit</span>
            </div>
            <div className="flex bg-[#08080a] rounded-md p-0.5 text-xs h-6 items-center border border-[#222226]">
              <button
                type="button"
                onClick={() => toggleGlobalUnit("kg")}
                className={cn(
                  "px-2 py-0.5 rounded font-semibold transition-all h-5 text-[10px] cursor-pointer",
                  globalUnit === "kg"
                    ? "bg-[#FF1E27] text-white shadow-sm"
                    : "text-[#888890] hover:text-white"
                )}
              >
                kg
              </button>
              <button
                type="button"
                onClick={() => toggleGlobalUnit("lbs")}
                className={cn(
                  "px-2 py-0.5 rounded font-semibold transition-all h-5 text-[10px] cursor-pointer",
                  globalUnit === "lbs"
                    ? "bg-[#FF1E27] text-white shadow-sm"
                    : "text-[#888890] hover:text-white"
                )}
              >
                lbs
              </button>
            </div>
          </div>
        </div>

        {/* User Auth Section */}
        <div className="p-3 border-t border-[#222226] space-y-2.5">
          <Show when="signed-out">
            <div className="space-y-1.5">
              <SignInButton mode="modal">
                <button className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider bg-[#FF1E27] hover:bg-[#d6111a] text-white shadow-md shadow-[#FF1E27]/20 transition-all cursor-pointer">
                  <LogIn className="w-3 h-3" />
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#222226] bg-[#16161a] hover:bg-[#1f1f26] text-white transition-all cursor-pointer">
                  <UserPlus className="w-3 h-3 text-[#888890]" />
                  Create Account
                </button>
              </SignUpButton>
            </div>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#16161a] border border-[#222226]">
              <div className="flex items-center gap-2.5 min-w-0">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonBox: "flex-row-reverse gap-1.5",
                      avatarBox: "w-7 h-7 rounded-full ring-2 ring-[#FF1E27] p-0.5",
                    },
                  }}
                  showName
                />
              </div>
            </div>
          </Show>
          <p className="text-[9px] text-[#888890] text-center font-display tracking-widest uppercase">
            Hypertrophy Lab
          </p>
        </div>
      </aside>

      {/* ─── MOBILE TOP HEADER BAR (Compact 56px height) ────────────────────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 border-b border-[#222226] bg-[#08080a]/95 backdrop-blur-md z-50">
        <div className="flex items-center justify-between h-full px-3.5">
          {/* Left Brand Mark + Title */}
          <Link href="/" className="flex items-center gap-2.5">
            <MuscleLabBrandMark className="w-6 h-6 text-[#FF1E27]" />
            <span className="font-display font-black text-xs sm:text-sm tracking-[0.2em] text-white">
              MUSCLE LAB
            </span>
          </Link>

          {/* Right: Circular Profile Avatar with Red Border Ring + Hamburger */}
          <div className="flex items-center gap-2.5">
            {/* Circular Profile Avatar */}
            <Show when="signed-in">
              <div className="relative flex items-center justify-center">
                <UserButton
                  appearance={{
                    elements: {
                      rootBox: "flex items-center justify-center",
                      avatarBox: "w-7 h-7 rounded-full ring-2 ring-[#FF1E27] p-0.5",
                    },
                  }}
                />
              </div>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="relative w-7 h-7 rounded-full ring-2 ring-[#FF1E27] p-0.5 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity focus:outline-none"
                  aria-label="Account Profile"
                >
                  <img
                    src="/images/user-avatar.jpg"
                    alt="Athlete Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                </button>
              </SignInButton>
            </Show>

            {/* Hamburger Toggle Icon (≡) */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1 text-[#888890] hover:text-white transition-colors cursor-pointer focus:outline-none"
              aria-label={mobileOpen ? "Close menu" : "Open navigation menu"}
            >
              {mobileOpen ? (
                <X className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <Menu className="w-5 h-5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ─── MOBILE SLIDE-OUT MENU DRAWER ────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed top-14 left-0 right-0 bottom-0 bg-[#121215] border-t border-[#222226] z-40 overflow-y-auto animate-fade-in-up">
            <nav className="p-3.5 space-y-1">
              {navItems.map((item) => {
                const isNavActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all",
                      isNavActive
                        ? "bg-[#2B0A0C] text-[#FF1E27] border-l-2 border-[#FF1E27]"
                        : "text-[#888890] hover:text-white hover:bg-[#16161a]"
                    )}
                  >
                    <item.icon className="w-4.5 h-4.5 text-current" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Weight Unit Preference */}
              <div className="pt-2.5 pb-1 border-t border-[#222226] mt-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#16161a] border border-[#222226]">
                  <div className="flex items-center gap-2">
                    <Scale className="w-3.5 h-3.5 text-[#FF1E27]" />
                    <div>
                      <div className="text-xs font-semibold text-white">Weight Unit</div>
                      <p className="text-[10px] text-[#888890]">Global display unit</p>
                    </div>
                  </div>
                  <div className="flex bg-[#08080a] rounded-md p-0.5 text-xs h-7 items-center border border-[#222226]">
                    <button
                      type="button"
                      onClick={() => toggleGlobalUnit("kg")}
                      className={cn(
                        "px-2.5 py-0.5 rounded font-semibold transition-all h-5.5 text-[11px] cursor-pointer",
                        globalUnit === "kg"
                          ? "bg-[#FF1E27] text-white shadow-sm"
                          : "text-[#888890] hover:text-white"
                      )}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleGlobalUnit("lbs")}
                      className={cn(
                        "px-2.5 py-0.5 rounded font-semibold transition-all h-5.5 text-[11px] cursor-pointer",
                        globalUnit === "lbs"
                          ? "bg-[#FF1E27] text-white shadow-sm"
                          : "text-[#888890] hover:text-white"
                      )}
                    >
                      lbs
                    </button>
                  </div>
                </div>
              </div>

              {/* Auth Buttons */}
              <div className="pt-3 border-t border-[#222226] mt-2.5">
                <Show when="signed-out">
                  <div className="space-y-2">
                    <SignInButton mode="modal">
                      <button
                        onClick={() => setMobileOpen(false)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold font-display uppercase tracking-wider bg-[#FF1E27] hover:bg-[#d6111a] text-white transition-colors"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        onClick={() => setMobileOpen(false)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-[#222226] bg-[#16161a] hover:bg-[#1f1f26] text-white transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-[#888890]" />
                        Create Account
                      </button>
                    </SignUpButton>
                  </div>
                </Show>
                <Show when="signed-in">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#16161a] border border-[#222226]">
                    <UserButton showName />
                  </div>
                </Show>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* ─── MOBILE BOTTOM NAVIGATION BAR (Compact 56px height) ─────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-[#121215]/95 backdrop-blur-md border-t border-[#222226] z-50">
        <div className="grid grid-cols-5 h-full">
          {mobileBottomTabs.map((item) => {
            const isNavActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-1 relative transition-all group",
                  isNavActive ? "text-[#FF1E27]" : "text-[#888890] hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4.5 h-4.5 transition-colors",
                    isNavActive ? "text-[#FF1E27]" : "text-[#888890] group-hover:text-white"
                  )}
                />
                <span
                  className={cn(
                    "text-[9.5px] font-medium tracking-tight mt-0.5",
                    isNavActive ? "text-white font-semibold" : "text-[#888890]"
                  )}
                >
                  {item.label}
                </span>

                {/* Active Red Underline Indicator Bar directly beneath selected tab */}
                {isNavActive && (
                  <span className="w-5 h-0.5 bg-[#FF1E27] rounded-full mt-0.5 animate-in fade-in zoom-in-95 duration-200" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating Active Session Banner (Above bottom bar) */}
      {showSessionBanner && (
        <FloatingBanner
          elapsedSeconds={elapsedSeconds}
          exerciseCount={sessionExercises.length}
          firstExerciseName={sessionExercises[0]?.exercise.name}
          liveVolume={liveVolume}
          unit={globalUnit}
        />
      )}
    </>
  );
}
