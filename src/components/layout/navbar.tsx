"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Dumbbell,
  LayoutDashboard,
  Library,
  LineChart,
  ClipboardList,
  BookOpen,
  Bot,
  Menu,
  X,
  Timer,
  LogIn,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/log", label: "Log Workout", icon: ClipboardList },
  { href: "/exercises", label: "Exercises", icon: Library },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/timer", label: "Rest Timer", icon: Timer },
  { href: "/science", label: "Research", icon: BookOpen },
  { href: "/ai", label: "AI Coach", icon: Bot },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-border bg-card z-50">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Hypertrophy
            </h1>
            <p className="text-xs text-muted-foreground -mt-0.5 tracking-widest uppercase">
              Lab
            </p>
          </div>
        </Link>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-500/10 text-blue-400 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-blue-400" : "text-muted-foreground"
                  )}
                />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Auth Section */}
        <div className="p-4 border-t border-border space-y-3">
          <Show when="signed-out">
            <div className="space-y-2">
              <SignInButton mode="modal">
                <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-secondary/50 hover:bg-secondary text-foreground transition-all cursor-pointer">
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </button>
              </SignUpButton>
            </div>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/40 border border-border/60">
              <div className="flex items-center gap-3 min-w-0">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonBox: "flex-row-reverse gap-2",
                    },
                  }}
                  showName
                />
              </div>
            </div>
          </Show>
          <p className="text-[11px] text-muted-foreground text-center">
            Science-backed hypertrophy
          </p>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border glass z-50">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">Hypertrophy Lab</span>
          </Link>
          <div className="flex items-center gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-out Menu */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed top-16 left-0 right-0 bottom-0 bg-card border-t border-border z-40 overflow-y-auto animate-fade-in-up">
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-lg text-base font-medium transition-all",
                      isActive
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-border mt-3">
                <Show when="signed-out">
                  <div className="space-y-2">
                    <SignInButton mode="modal">
                      <button
                        onClick={() => setMobileOpen(false)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        onClick={() => setMobileOpen(false)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </button>
                    </SignUpButton>
                  </div>
                </Show>
                <Show when="signed-in">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                    <UserButton showName />
                  </div>
                </Show>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border glass z-50">
        <div className="flex items-center justify-around h-full px-1">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-w-0",
                  isActive
                    ? "text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium truncate">
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-5 h-0.5 rounded-full bg-blue-400" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
