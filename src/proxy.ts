/**
 * src/proxy.ts — Next.js Middleware (network gateway)
 *
 * Acts as the application's single network ingress point.
 * Responsibilities:
 *   1. Route matching — determine public vs. protected pages
 *   2. Authentication enforcement — redirect unauthenticated users on
 *      protected pages; protect API routes before they reach handlers
 *   3. API route hardening — /api/sessions and /api/logs require a
 *      valid Clerk session before any Supabase / Gemini work begins
 *
 * Convention: this file is named proxy.ts (not middleware.ts) to align
 * with the Next.js 16 recommended gateway pattern while keeping the
 * standard middleware export shape that the framework expects.
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Route classifications ──────────────────────────────────────────────────────

/** Pages anyone can visit without signing in */
const isPublicPage = createRouteMatcher([
  "/",
  "/exercises(.*)",
  "/timer(.*)",
  "/science(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

/**
 * API routes that require a verified Clerk session before execution.
 * The chat and sessions endpoints hit Gemini / Supabase and must never
 * be invoked by unauthenticated callers.
 */
const isProtectedApiRoute = createRouteMatcher([
  "/api/sessions(.*)",
  "/api/logs(.*)",
  "/api/chat(.*)",
]);

// ── Middleware handler ─────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // 1. Protect sensitive API routes — return 401 JSON before handler runs
  if (isProtectedApiRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to access this resource." },
        { status: 401 }
      );
    }
    // Authenticated — let the request continue
    return NextResponse.next();
  }

  // 2. Protect non-public page routes — redirect to sign-in
  if (!isPublicPage(req)) {
    await auth.protect();
  }
});

// ── Matcher config ─────────────────────────────────────────────────────────────
// Skip Next.js internals and static files so the middleware only runs on
// real application routes and API handlers.
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|webmanifest|png|jpg|jpeg|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
