"use client";

import { useState, useMemo } from "react";
import { exercises, muscleGroups, muscleGroupColors } from "@/lib/exercises";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Minimize2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function ExercisesPage() {
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  // Interactive state map tracking expanded/collapsed state for each muscle group
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    muscleGroups.forEach((muscle) => {
      initial[muscle] = true;
    });
    return initial;
  });

  // Filter exercises based on search query and selected muscle pill
  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exercises.filter((exercise) => {
      const matchesSearch =
        query === "" ||
        exercise.name.toLowerCase().includes(query) ||
        exercise.primaryMuscle.toLowerCase().includes(query) ||
        exercise.secondaryMuscle.toLowerCase().includes(query) ||
        exercise.equipment.toLowerCase().includes(query);

      const matchesMuscle =
        !selectedMuscle ||
        exercise.primaryMuscle === selectedMuscle ||
        exercise.secondaryMuscle === selectedMuscle;

      return matchesSearch && matchesMuscle;
    });
  }, [search, selectedMuscle]);

  // Group filtered exercises by primary muscle group
  const groupedExercises = useMemo(() => {
    const groups: Record<string, typeof exercises> = {};
    filteredExercises.forEach((exercise) => {
      const muscle = exercise.primaryMuscle;
      if (!groups[muscle]) groups[muscle] = [];
      groups[muscle].push(exercise);
    });
    return groups;
  }, [filteredExercises]);

  // Visible muscle groups ordered according to canonical muscleGroups list
  const visibleMuscleGroups = useMemo(() => {
    const canonical = muscleGroups.filter(
      (muscle) => (groupedExercises[muscle]?.length || 0) > 0
    );
    const extras = Object.keys(groupedExercises).filter(
      (muscle) => !muscleGroups.includes(muscle)
    );
    return [...canonical, ...extras];
  }, [groupedExercises]);

  // Handle single group toggle
  const toggleGroup = (muscle: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [muscle]: !prev[muscle],
    }));
  };

  // Expand all muscle groups
  const handleExpandAll = () => {
    setExpandedGroups(() => {
      const next: Record<string, boolean> = {};
      muscleGroups.forEach((m) => {
        next[m] = true;
      });
      return next;
    });
  };

  // Collapse all muscle groups
  const handleCollapseAll = () => {
    setExpandedGroups(() => {
      const next: Record<string, boolean> = {};
      muscleGroups.forEach((m) => {
        next[m] = false;
      });
      return next;
    });
  };

  // Synchronize muscle filter pill selection with accordion expansion
  const handleMuscleSelect = (muscle: string | null) => {
    if (muscle === selectedMuscle) {
      // Toggle off to All -> expand all by default
      setSelectedMuscle(null);
      setExpandedGroups(() => {
        const next: Record<string, boolean> = {};
        muscleGroups.forEach((m) => {
          next[m] = true;
        });
        return next;
      });
      return;
    }

    setSelectedMuscle(muscle);

    if (muscle) {
      // Automatically expand that specific muscle group accordion while collapsing inactive ones
      setExpandedGroups(() => {
        const next: Record<string, boolean> = {};
        muscleGroups.forEach((m) => {
          next[m] = m === muscle;
        });
        return next;
      });
    } else {
      // When All is explicitly chosen, default all to expanded
      setExpandedGroups(() => {
        const next: Record<string, boolean> = {};
        muscleGroups.forEach((m) => {
          next[m] = true;
        });
        return next;
      });
    }
  };

  // Search input handler with auto-expansion for search matches
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (value.trim()) {
      setExpandedGroups((prev) => {
        const next = { ...prev };
        muscleGroups.forEach((m) => {
          next[m] = true;
        });
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
          Exercise Library
        </h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Browse {exercises.length} science-backed exercises across {muscleGroups.length} muscle groups
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search exercises, muscle groups, or equipment..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-9 bg-[#121215] border-border/70 focus-visible:border-primary focus-visible:ring-primary/20 h-9.5 text-xs text-white placeholder:text-muted-foreground rounded-lg"
        />
        {search && (
          <button
            type="button"
            onClick={() => handleSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-white hover:bg-secondary cursor-pointer transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Ultra-Compact Muscle Group Filter Tags */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap">
        <button
          type="button"
          onClick={() => handleMuscleSelect(null)}
          className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1 ${
            selectedMuscle === null
              ? "bg-primary text-white font-semibold shadow-sm shadow-primary/20"
              : "bg-[#121215] text-muted-foreground hover:text-white hover:bg-[#1a1a22] border-0"
          }`}
        >
          <Filter className="w-3 h-3" />
          All
          <span className="opacity-70 text-[10px] font-mono">({exercises.length})</span>
        </button>
        {muscleGroups.map((muscle) => {
          const isActive = selectedMuscle === muscle;
          const count = exercises.filter(
            (e) => e.primaryMuscle === muscle || e.secondaryMuscle === muscle
          ).length;
          return (
            <button
              key={muscle}
              type="button"
              onClick={() => handleMuscleSelect(muscle)}
              className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1 ${
                isActive
                  ? "bg-primary text-white font-semibold shadow-sm shadow-primary/20"
                  : "bg-[#121215] text-muted-foreground hover:text-white hover:bg-[#1a1a22] border-0"
              }`}
            >
              {muscle}
              <span className="opacity-60 text-[10px] font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Results Count & Quick Toggle Bar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Showing <span className="font-semibold text-white">{filteredExercises.length}</span> of{" "}
            <span className="font-semibold text-white">{exercises.length}</span>
          </span>
          {selectedMuscle && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] bg-red-950/40 border border-primary/30 text-primary font-medium">
              <span>{selectedMuscle}</span>
              <button
                type="button"
                onClick={() => handleMuscleSelect(null)}
                className="hover:text-white transition-colors cursor-pointer"
                aria-label="Clear muscle filter"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
        </div>

        {/* Global Expand All / Collapse All Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-2 py-0.5 text-[11px] text-muted-foreground hover:text-white hover:bg-[#121215] rounded font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronsUpDown className="w-3 h-3 text-primary" />
            <span>Expand All</span>
          </button>
          <span className="text-white/10">|</span>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-2 py-0.5 text-[11px] text-muted-foreground hover:text-white hover:bg-[#121215] rounded font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Minimize2 className="w-2.5 h-2.5 text-muted-foreground" />
            <span>Collapse All</span>
          </button>
        </div>
      </div>

      {/* Exercise Content — Seamless Borderless Dropdown/Accordion List */}
      {visibleMuscleGroups.length === 0 ? (
        <Card className="border-border/60 bg-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
            <h3 className="font-semibold text-base mb-1 text-white">No exercises found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-4">
              {search
                ? `No exercises match "${search}". Try adjusting your keywords or clearing filters.`
                : "No exercises match the selected filters."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                handleMuscleSelect(null);
              }}
              className="border-border hover:border-primary/50 hover:text-white cursor-pointer text-xs h-8"
            >
              Reset Filters &amp; Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 divide-y divide-white/5">
          {visibleMuscleGroups.map((muscle) => {
            const exs = groupedExercises[muscle] || [];
            const colors = muscleGroupColors[muscle] || {
              bg: "bg-gray-500/20",
              text: "text-gray-400",
            };
            const isExpanded = expandedGroups[muscle] ?? true;

            return (
              <section
                key={muscle}
                className="pt-3 first:pt-0 border-0 shadow-none bg-transparent"
              >
                {/* Sleek Accordion Header Row */}
                <button
                  type="button"
                  onClick={() => toggleGroup(muscle)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between py-1.5 px-0.5 text-left select-none cursor-pointer group hover:opacity-90 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${colors.text.replace(
                        "text-",
                        "bg-"
                      )} ring-1 ring-white/10`}
                    />
                    <h2 className="text-sm sm:text-base font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                      {muscle}
                    </h2>
                    <span className="text-[11px] font-medium text-muted-foreground font-mono">
                      ({exs.length})
                    </span>
                  </div>

                  {/* Chevron Toggle Icon */}
                  <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
                    <span className="text-[11px] font-medium hidden sm:inline">
                      {isExpanded ? "Collapse" : "Expand"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 transition-transform duration-200" />
                    ) : (
                      <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                    )}
                  </div>
                </button>

                {/* Accordion Body: Clean, Edge-to-Edge Row Items */}
                {isExpanded && (
                  <div className="pt-1 pb-1">
                    <div className="divide-y divide-white/5 sm:grid sm:grid-cols-2 sm:divide-y-0 sm:gap-1.5">
                      {exs.map((exercise) => {
                        const primaryColors =
                          muscleGroupColors[exercise.primaryMuscle] || {
                            bg: "bg-muted",
                            text: "text-muted-foreground",
                          };
                        const secondaryColors =
                          muscleGroupColors[exercise.secondaryMuscle] || {
                            bg: "bg-muted",
                            text: "text-muted-foreground",
                          };

                        return (
                          <Link
                            key={exercise.id}
                            href={`/log?exercise=${exercise.id}`}
                            className="group block p-2 sm:p-2.5 rounded-lg hover:bg-[#121215] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-xs sm:text-sm text-white group-hover:text-primary transition-colors truncate">
                                  {exercise.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                  <span className="truncate">{exercise.equipment}</span>
                                  <span className="text-white/20">•</span>
                                  <span
                                    className={`text-[10px] font-medium ${primaryColors.text}`}
                                  >
                                    {exercise.primaryMuscle}
                                  </span>
                                  {exercise.secondaryMuscle && (
                                    <>
                                      <span className="text-white/20">•</span>
                                      <span
                                        className={`text-[10px] opacity-75 ${secondaryColors.text}`}
                                      >
                                        {exercise.secondaryMuscle}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                                <span className="text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity hidden xs:inline">
                                  Log
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
