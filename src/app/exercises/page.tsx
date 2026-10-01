"use client";

import { useState, useMemo } from "react";
import { exercises, muscleGroups, muscleGroupColors } from "@/lib/exercises";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Dumbbell, X } from "lucide-react";
import Link from "next/link";

export default function ExercisesPage() {
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch =
        search === "" ||
        exercise.name.toLowerCase().includes(search.toLowerCase()) ||
        exercise.primaryMuscle.toLowerCase().includes(search.toLowerCase()) ||
        exercise.secondaryMuscle.toLowerCase().includes(search.toLowerCase()) ||
        exercise.equipment.toLowerCase().includes(search.toLowerCase());

      const matchesMuscle =
        !selectedMuscle ||
        exercise.primaryMuscle === selectedMuscle ||
        exercise.secondaryMuscle === selectedMuscle;

      return matchesSearch && matchesMuscle;
    });
  }, [search, selectedMuscle]);

  // Group exercises by primary muscle
  const groupedExercises = useMemo(() => {
    const groups: Record<string, typeof exercises> = {};
    filteredExercises.forEach((exercise) => {
      const muscle = exercise.primaryMuscle;
      if (!groups[muscle]) groups[muscle] = [];
      groups[muscle].push(exercise);
    });
    return groups;
  }, [filteredExercises]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Exercise Library
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse {exercises.length} exercises by muscle group
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search exercises, muscle groups, or equipment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary/50 border-border h-11"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-secondary"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Muscle Group Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedMuscle === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedMuscle(null)}
          className={
            selectedMuscle === null
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "border-border text-muted-foreground hover:text-foreground"
          }
        >
          <Filter className="w-3.5 h-3.5 mr-1.5" />
          All
        </Button>
        {muscleGroups.map((muscle) => {
          const isActive = selectedMuscle === muscle;
          const colors = muscleGroupColors[muscle];
          const count = exercises.filter(
            (e) => e.primaryMuscle === muscle || e.secondaryMuscle === muscle
          ).length;
          return (
            <Button
              key={muscle}
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedMuscle(isActive ? null : muscle)
              }
              className={
                isActive
                  ? `${colors.bg} ${colors.text} border-transparent`
                  : "border-border text-muted-foreground hover:text-foreground"
              }
            >
              {muscle}
              <span className="ml-1.5 text-xs opacity-60">{count}</span>
            </Button>
          );
        })}
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredExercises.length} of {exercises.length} exercises
        {selectedMuscle && (
          <span>
            {" "}
            targeting <span className="text-foreground font-medium">{selectedMuscle}</span>
          </span>
        )}
      </p>

      {/* Exercise Grid — Grouped by Muscle */}
      {Object.keys(groupedExercises).length === 0 ? (
        <Card className="border-border bg-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-semibold mb-1">No exercises found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedExercises).map(([muscle, exs]) => {
            const colors = muscleGroupColors[muscle] || {
              bg: "bg-gray-500/20",
              text: "text-gray-400",
            };
            return (
              <div key={muscle}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${colors.text.replace("text-", "bg-")}`} />
                  <h2 className="text-lg font-semibold">{muscle}</h2>
                  <span className="text-sm text-muted-foreground">
                    ({exs.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {exs.map((exercise, idx) => {
                    const primaryColors =
                      muscleGroupColors[exercise.primaryMuscle];
                    const secondaryColors =
                      muscleGroupColors[exercise.secondaryMuscle];
                    return (
                      <Link
                        key={exercise.id}
                        href={`/log?exercise=${exercise.id}`}
                      >
                        <Card
                          className="group border-border bg-card hover:bg-secondary/50 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden"
                          style={{
                            animationDelay: `${idx * 50}ms`,
                          }}
                        >
                          {/* Placeholder Image */}
                          <div className="relative h-40 bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent z-10" />
                            <Dumbbell className="w-12 h-12 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                            <div className="absolute bottom-3 left-3 right-3 z-20">
                              <h3 className="font-semibold text-sm leading-tight">
                                {exercise.name}
                              </h3>
                            </div>
                          </div>
                          <CardContent className="p-3 pt-2">
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              <Badge
                                variant="secondary"
                                className={`${primaryColors.bg} ${primaryColors.text} border-0 text-[10px] px-2 py-0.5`}
                              >
                                {exercise.primaryMuscle}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={`${secondaryColors.bg} ${secondaryColors.text} border-0 text-[10px] px-2 py-0.5`}
                              >
                                {exercise.secondaryMuscle}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {exercise.equipment}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
