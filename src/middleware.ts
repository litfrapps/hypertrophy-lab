import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import {
  preferredType,
  appendVaryAccept,
  getMarkdownForPath,
  getMarkdown404,
} from "@/lib/agent-negotiation";

const isProtectedApiRoute = createRouteMatcher([
  "/api/sessions(.*)",
  "/api/logs(.*)",
  "/api/routines(.*)",
  "/api/settings(.*)",
]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedApiRoute(req)) {
    await auth.protect();
  }
});

function isBotOrAgent(req: NextRequest): boolean {
  const ua = req.headers.get("user-agent")?.toLowerCase() || "";
  const accept = req.headers.get("accept")?.toLowerCase() || "";
  if (accept.includes("text/markdown")) return true;
  return (
    ua.includes("bot") ||
    ua.includes("crawler") ||
    ua.includes("spider") ||
    ua.includes("agent") ||
    ua.includes("ora") ||
    ua.includes("curl") ||
    ua.includes("wget") ||
    ua.includes("python") ||
    ua.includes("node") ||
    ua.includes("headless") ||
    ua.includes("lighthouse")
  );
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;

  // Let static files, Next internals, and API routes pass without content negotiation
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt" ||
    pathname === "/agent-instructions.md" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes(".")
  ) {
    if (isProtectedApiRoute(req)) {
      return clerkHandler(req, event);
    }
    const res = NextResponse.next();
    appendVaryAccept(res.headers);
    return res;
  }

  // Handle explicit .md URLs
  if (pathname.endsWith(".md")) {
    const cleanPath = pathname.slice(0, -3) || "/";
    const md = getMarkdownForPath(cleanPath);
    if (md) {
      return new Response(md, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          Vary: "Accept",
          "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
        },
      });
    }
    return new Response(getMarkdown404(pathname), {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
      },
    });
  }

  // Content negotiation on accept header
  const acceptHeader = req.headers.get("accept");
  const chosen = preferredType(acceptHeader);

  if (chosen === "text/markdown") {
    const md = getMarkdownForPath(pathname);
    if (md) {
      return new Response(md, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          Vary: "Accept",
          "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
        },
      });
    }

    // Agent-friendly 404 with markdown body
    return new Response(getMarkdown404(pathname), {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
      },
    });
  }

  if (chosen === null && acceptHeader) {
    return new Response("Not Acceptable\n\nAvailable: text/html, text/markdown\n", {
      status: 406,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        Vary: "Accept",
      },
    });
  }

  // Ensure protected API routes always execute Clerk auth
  if (isProtectedApiRoute(req)) {
    const res = await clerkHandler(req, event);
    if (res) appendVaryAccept(res.headers);
    return res;
  }

  // For crawlers/agents/curl accessing public pages without existing session cookies:
  // Bypass Clerk development handshake to serve raw HTML directly without redirect loops.
  if (isBotOrAgent(req) && !req.cookies.has("__session")) {
    const res = NextResponse.next();
    appendVaryAccept(res.headers);
    return res;
  }

  const res = await clerkHandler(req, event);
  if (res) {
    appendVaryAccept(res.headers);
    return res;
  }
  const nextRes = NextResponse.next();
  appendVaryAccept(nextRes.headers);
  return nextRes;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|webmanifest|png|jpg|jpeg|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
