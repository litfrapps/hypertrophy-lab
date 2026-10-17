import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  parseAccept,
  preferredType,
  appendVaryAccept,
  getMarkdownForPath,
  getMarkdown404,
  isKnownPageRoute,
} from "../src/lib/agent-negotiation.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("parseAccept - correctly parses media types, q-values, and specificities", () => {
  const entries = parseAccept("text/html, text/markdown;q=0.8, */*;q=0.1");
  assert.equal(entries.length, 3);
  assert.deepEqual(entries[0], { type: "text/html", q: 1, specificity: 2 });
  assert.deepEqual(entries[1], { type: "text/markdown", q: 0.8, specificity: 2 });
  assert.deepEqual(entries[2], { type: "*/*", q: 0.1, specificity: 0 });
});

test("preferredType - selects text/markdown when requested with priority", () => {
  assert.equal(preferredType("text/markdown"), "text/markdown");
  assert.equal(
    preferredType("text/markdown, text/html;q=0.9"),
    "text/markdown"
  );
  assert.equal(
    preferredType("text/markdown;q=1.0, text/html;q=0.5"),
    "text/markdown"
  );
});

test("preferredType - selects text/html for browsers and default requests", () => {
  assert.equal(preferredType("text/html"), "text/html");
  assert.equal(
    preferredType("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"),
    "text/html"
  );
  assert.equal(preferredType("*/*"), "text/html");
  assert.equal(preferredType(null), "text/html");
  assert.equal(preferredType(""), "text/html");
});

test("preferredType - returns null for incompatible types (406 Not Acceptable)", () => {
  assert.equal(preferredType("application/json"), null);
  assert.equal(preferredType("image/webp, image/png"), null);
  assert.equal(preferredType("text/html;q=0, text/markdown;q=0"), null);
});

test("appendVaryAccept - sets and merges Vary header properly", () => {
  const h1 = new Headers();
  appendVaryAccept(h1);
  assert.equal(h1.get("Vary"), "Accept");

  const h2 = new Headers({ Vary: "RSC, Next-Router-State-Tree" });
  appendVaryAccept(h2);
  assert.equal(h2.get("Vary"), "RSC, Next-Router-State-Tree, Accept");

  // Idempotent: does not append duplicate Accept
  appendVaryAccept(h2);
  assert.equal(h2.get("Vary"), "RSC, Next-Router-State-Tree, Accept");
});

test("isKnownPageRoute - detects app routes accurately", () => {
  assert.equal(isKnownPageRoute("/"), true);
  assert.equal(isKnownPageRoute("/about"), true);
  assert.equal(isKnownPageRoute("/exercises"), true);
  assert.equal(isKnownPageRoute("/log"), true);
  assert.equal(isKnownPageRoute("/progress"), true);
  assert.equal(isKnownPageRoute("/non-existent-page"), false);
  assert.equal(isKnownPageRoute("/__ora-404-probe-test"), false);
});

test("getMarkdownForPath - serves valid, rich Markdown representation", () => {
  const homeMd = getMarkdownForPath("/");
  assert.ok(homeMd);
  assert.ok(homeMd.includes("# Hypertrophy Lab"));
  assert.ok(homeMd.includes("Workout Logger"));
  assert.ok(homeMd.includes("Progressive Overload"));
  assert.ok(homeMd.includes("https://hypertrophy-lab-ten.vercel.app/llms.txt"));
  assert.ok(homeMd.length > 500);

  const aboutMd = getMarkdownForPath("/about");
  assert.ok(aboutMd);
  assert.ok(aboutMd.includes("About Hypertrophy Lab"));
  assert.ok(aboutMd.includes("Hypertrophy Training Methodology"));

  const exercisesMd = getMarkdownForPath("/exercises");
  assert.ok(exercisesMd);
  assert.ok(exercisesMd.includes("Exercise Library"));

  assert.equal(getMarkdownForPath("/non-existent-probe"), null);
});

test("getMarkdown404 - meets agent-friendly 404 requirements", () => {
  const body = getMarkdown404("/__ora-404-probe-n1f7f096");
  assert.ok(body.includes("# 404 Not Found"));
  assert.ok(body.includes("/__ora-404-probe-n1f7f096"));
  assert.ok(body.includes("llms.txt"));
  assert.ok(body.length > 100); // Exceeds the 20 character requirement
});

test("public/llms.txt - contains 'When to Use This' guidance and agent instructions", () => {
  const llmsPath = path.resolve(__dirname, "../public/llms.txt");
  assert.ok(fs.existsSync(llmsPath), "llms.txt must exist in public/");

  const content = fs.readFileSync(llmsPath, "utf8");
  assert.ok(content.includes("# Hypertrophy Lab"));
  assert.ok(content.includes("## When to Use This"));
  assert.ok(content.includes("## How Agents Should Call Hypertrophy Lab"));
  assert.ok(content.includes("Accept: text/markdown"));
  assert.ok(content.includes("Progressive Overload"));
  assert.ok(content.includes("When NOT to Use This"));
});
