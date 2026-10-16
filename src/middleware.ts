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

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|webmanifest|png|jpg|jpeg|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
