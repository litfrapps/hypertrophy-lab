import Link from "next/link";
import { ArrowLeft, Home, FileText, Dumbbell, LineChart } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12 max-w-xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-[#2B0A0C] border border-[#FF1E27]/30 flex items-center justify-center text-[#FF1E27] mb-6 shadow-lg shadow-[#FF1E27]/10">
        <span className="font-display font-black text-2xl tracking-wider">404</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        Page Not Found
      </h1>

      <p className="text-sm text-[#888890] mt-3 leading-relaxed max-w-md">
        The requested page or resource could not be found on Hypertrophy Lab. Please verify the URL or explore the following resources:
      </p>

      <div className="w-full mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left text-xs">
        <Link
          href="/"
          className="flex items-center gap-2.5 p-3 rounded-lg bg-[#121215] border border-[#222226] hover:border-[#FF1E27]/40 text-white transition-all group"
        >
          <Home className="w-4 h-4 text-[#FF1E27] shrink-0" />
          <div>
            <div className="font-bold font-display uppercase tracking-wider text-[11px]">
              Dashboard
            </div>
            <div className="text-[10px] text-[#888890]">Return to overview</div>
          </div>
        </Link>

        <Link
          href="/exercises"
          className="flex items-center gap-2.5 p-3 rounded-lg bg-[#121215] border border-[#222226] hover:border-[#FF1E27]/40 text-white transition-all group"
        >
          <Dumbbell className="w-4 h-4 text-[#FF1E27] shrink-0" />
          <div>
            <div className="font-bold font-display uppercase tracking-wider text-[11px]">
              Exercises
            </div>
            <div className="text-[10px] text-[#888890]">Browse movement library</div>
          </div>
        </Link>

        <Link
          href="/progress"
          className="flex items-center gap-2.5 p-3 rounded-lg bg-[#121215] border border-[#222226] hover:border-[#FF1E27]/40 text-white transition-all group"
        >
          <LineChart className="w-4 h-4 text-[#FF1E27] shrink-0" />
          <div>
            <div className="font-bold font-display uppercase tracking-wider text-[11px]">
              Progress
            </div>
            <div className="text-[10px] text-[#888890]">Analyze volume load</div>
          </div>
        </Link>

        <Link
          href="/llms.txt"
          className="flex items-center gap-2.5 p-3 rounded-lg bg-[#121215] border border-[#222226] hover:border-[#FF1E27]/40 text-white transition-all group"
        >
          <FileText className="w-4 h-4 text-[#FF1E27] shrink-0" />
          <div>
            <div className="font-bold font-display uppercase tracking-wider text-[11px]">
              Agent Guidance
            </div>
            <div className="text-[10px] text-[#888890]">Machine-readable llms.txt</div>
          </div>
        </Link>
      </div>

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF1E27] hover:bg-[#d6111a] text-white font-display font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-[#FF1E27]/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
