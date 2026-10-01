"use client";

import { useState } from "react";
import { RestTimer } from "@/components/timer/rest-timer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, Timer, Sparkles, Check, Flame } from "lucide-react";
import Link from "next/link";

export default function TimerPage() {
  const [customMinutes, setCustomMinutes] = useState("2");
  const [customSeconds, setCustomSeconds] = useState("0");
  const [activeDuration, setActiveDuration] = useState(120);

  const applyCustom = () => {
    const mins = parseInt(customMinutes) || 0;
    const secs = parseInt(customSeconds) || 0;
    const total = mins * 60 + secs;
    if (total > 0) {
      setActiveDuration(total);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1 text-blue-400 text-sm font-medium">
          <Timer className="w-4 h-4" />
          <span>Inter-Set Recovery</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Rest Period Optimizer</h1>
        <p className="text-muted-foreground mt-1">
          Customizable countdown timer engineered for maximal mechanical tension & muscle fiber recruitment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Timer Display */}
        <div className="lg:col-span-7">
          <RestTimer
            initialSeconds={activeDuration}
            title="Active Set Countdown"
            subtitle="Timer sounds when it is time to perform your next set"
          />
        </div>

        {/* Scientific Context & Custom Input */}
        <div className="lg:col-span-5 space-y-4">
          {/* Custom Duration Config */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Custom Duration</span>
                <Badge variant="outline" className="text-xs border-border">
                  Personalize
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Minutes</label>
                  <Input
                    type="number"
                    min="0"
                    max="15"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="bg-secondary/40 border-border"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Seconds</label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(e.target.value)}
                    className="bg-secondary/40 border-border"
                  />
                </div>
              </div>
              <Button
                onClick={applyCustom}
                variant="secondary"
                className="w-full text-xs font-semibold hover:bg-blue-600 hover:text-white transition-colors"
              >
                Set Custom Rest Time
              </Button>
            </CardContent>
          </Card>

          {/* Research Insight Card */}
          <Card className="border-blue-500/20 bg-blue-950/10">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                <BookOpen className="w-4 h-4" />
                <span>The Science on Rest Periods</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                In a landmark study led by <strong className="text-foreground">Dr. Brad Schoenfeld (2016)</strong>, resistance-trained men who rested <strong className="text-foreground">3 minutes</strong> between sets achieved significantly greater muscle thickness and 1RM strength gains compared to those resting 1 minute.
              </p>
              <div className="p-2.5 rounded-lg bg-secondary/50 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Check className="w-3.5 h-3.5 text-green-400" /> Compound Movements (Squat, Bench): 2.5 - 3.5 min
                </div>
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Check className="w-3.5 h-3.5 text-cyan-400" /> Isolation Movements (Curls, Raises): 60 - 90 sec
                </div>
              </div>
              <Link
                href="/science"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline pt-1 font-medium"
              >
                Read Schoenfeld 2016 Study <ExternalLink className="w-3 h-3 ml-0.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
