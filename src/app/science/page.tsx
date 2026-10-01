"use client";

import { useState, useMemo } from "react";
import { researchPapers, paperCategories } from "@/lib/papers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Search,
  ExternalLink,
  Award,
  CheckCircle2,
  Share2,
  Sparkles,
  Bot,
  Filter,
} from "lucide-react";
import Link from "next/link";

export default function SciencePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredPapers = useMemo(() => {
    return researchPapers.filter((paper) => {
      const matchesCategory =
        selectedCategory === "All" || paper.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.authors.some((a) =>
          a.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.keyFindings.some((f) =>
          f.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/30 via-navy-800 to-indigo-900/20 border border-blue-500/20 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2 text-blue-400 font-semibold text-sm">
          <Award className="w-5 h-5" />
          <span>Evidence-Based Hypertrophy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Peer-Reviewed Science Hub
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed text-sm sm:text-base">
          Every recommendation in Hypertrophy Lab is backed by empirical sports science.
          Explore seminal publications by leading researchers including{" "}
          <strong className="text-foreground">Dr. Brad Schoenfeld</strong>,{" "}
          <strong className="text-foreground">Dr. Stuart Phillips</strong>, and{" "}
          <strong className="text-foreground">Alan Aragon</strong>.
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-400" /> {researchPapers.length} Peer-Reviewed Studies
          </span>
          <span>•</span>
          <span>Open Access PubMed & DOI Links</span>
          <span>•</span>
          <span>Direct AI Citation Integration</span>
        </div>
      </div>

      {/* Search & Categories Bar */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search research by author (e.g. Schoenfeld), topic, keyword or finding..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-card border-border"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0 ml-1 mr-1" />
          {paperCategories.map((category) => {
            const isSelected = selectedCategory === category;
            const count =
              category === "All"
                ? researchPapers.length
                : researchPapers.filter((p) => p.category === category).length;
            return (
              <Button
                key={category}
                size="sm"
                variant={isSelected ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full text-xs shrink-0 transition-all ${
                  isSelected
                    ? "bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {category}
                <span className="ml-1.5 opacity-60 text-[10px]">({count})</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Papers Grid / List */}
      <div className="space-y-4">
        {filteredPapers.length === 0 ? (
          <Card className="border-border bg-card border-dashed">
            <CardContent className="py-16 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground">No studies match your query</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try searching for different terms like "volume", "protein", or "failure".
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPapers.map((paper) => (
            <Card
              key={paper.id}
              className="border-border bg-card hover:border-blue-500/30 transition-all duration-200"
            >
              <CardContent className="p-5 sm:p-6 space-y-4">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs font-semibold">
                        {paper.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {paper.journal} • {paper.year}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-snug">
                      {paper.title}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {paper.authors.join(", ")}
                    </p>
                  </div>

                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-blue-600 hover:text-white text-xs font-semibold text-muted-foreground transition-colors self-start"
                  >
                    <span>Read Paper</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Abstract snippet */}
                <p className="text-xs sm:text-sm text-muted-foreground/90 leading-relaxed border-l-2 border-blue-500/40 pl-3 italic">
                  "{paper.abstract}"
                </p>

                {/* Key Findings Box */}
                <div className="rounded-xl bg-secondary/40 p-4 border border-border/60 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Key Empirical Findings
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {paper.keyFindings.map((finding, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold mt-0.5">•</span>
                        <span className="leading-normal">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    DOI: {paper.doi}
                  </span>

                  <Link
                    href={`/ai?prompt=${encodeURIComponent(
                      `Can you explain the practical takeaways from the study "${paper.title}" by ${paper.authors[0]} (${paper.year}) for my workout routine?`
                    )}`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-blue-400 hover:text-white hover:bg-blue-600/20"
                    >
                      <Bot className="w-3.5 h-3.5 mr-1.5" /> Ask AI about this paper
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
