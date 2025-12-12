import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 text-center space-y-8 px-4 max-w-2xl">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight">
            PingPong Pro
          </h1>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
            The ultimate platform for office competition. Track ELO, organize tournaments, and claim the championship title.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105"
          >
            Start Playing
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="text-slate-400 hover:text-white font-medium text-lg px-8 py-4">
            Learn Rules
          </button>
        </div>

        <div className="pt-12 grid grid-cols-3 gap-8 text-center text-slate-500 border-t border-slate-800">
          <div>
            <div className="text-2xl font-bold text-white">50+</div>
            <div className="text-sm">Matches Weekly</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">30</div>
            <div className="text-sm">Active Players</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">ELO</div>
            <div className="text-sm">Ranking System</div>
          </div>
        </div>
      </div>
    </div>
  );
}
