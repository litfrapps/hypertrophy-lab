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

const isProtectedApiRoute = createRouteMatcher([
  "/api/sessions(.*)",
  "/api/logs(.*)",
  "/api/routines(.*)",
  "/api/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedApiRoute(req)) {
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
