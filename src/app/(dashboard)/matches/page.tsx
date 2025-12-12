import { Plus, Filter, Search, Calendar, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MatchesPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const matches = await db.match.findMany({
        orderBy: { date: 'desc' },
        include: {
            player1: true,
            player2: true,
            winner: true,
            games: true,
        }
    });

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Matches</h2>
                    <p className="text-slate-400 mt-1">Track history and validate pending results.</p>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-sm font-semibold transition-all hover:scale-105">
                    <Plus size={18} />
                    Log Result
                </button>
            </div>

            {/* Filters (Visual Only for now) */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search players..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <Filter size={16} />
                        <span>Status</span>
                        <ChevronDown size={14} className="text-slate-500" />
                    </button>
                    <button className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <Calendar size={16} />
                        <span>Date</span>
                    </button>
                </div>
            </div>

            {/* Match Grid */}
            <div className="space-y-4">
                {matches.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No matches found.</div>
                ) : (
                    matches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                    ))
                )}
            </div>
        </div>
    );
}

function MatchCard({ match }: any) {
    const isPending = match.status === 'PENDING';

    return (
        <div className={cn(
            "group relative overflow-hidden rounded-2xl border p-5 transition-all hover:scale-[1.01]",
            isPending ? "bg-slate-900/80 border-amber-900/30 hover:border-amber-500/30" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
        )}>
            {/* Status Indicator Stripe */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1",
                isPending ? "bg-amber-500" : "bg-emerald-500"
            )} />

            <div className="flex flex-col md:flex-row items-center gap-6 pl-3">
                {/* Date */}
                <div className="hidden md:flex flex-col items-center justify-center min-w-[70px] py-1">
                    <span className="text-2xl font-bold text-slate-200">{new Date(match.date).getDate()}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase">{new Date(match.date).toLocaleString('default', { month: 'short' })}</span>
                </div>

                {/* Match Content */}
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

                    {/* Players & Score */}
                    <div className="md:col-span-2 flex items-center justify-between md:justify-start gap-8">
                        {/* Player 1 */}
                        <div className={cn("text-right flex-1 md:flex-none md:w-32 transition-colors", match.winnerId === match.player1Id ? "text-white font-bold" : "text-slate-400 font-medium")}>
                            {match.player1.name.split(' ')[0]}
                        </div>

                        {/* Middle Score */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1">
                                {match.games.map((g: any, i: number) => (
                                    <div key={i} className={cn("flex flex-col items-center justify-center w-8 h-10 rounded bg-slate-950 border text-xs font-mono", isPending ? "border-slate-800 text-slate-500" : "border-slate-700 text-slate-300")}>
                                        <span>{g.scorePlayer1}</span>
                                        <div className="h-[1px] w-4 bg-slate-800" />
                                        <span>{g.scorePlayer2}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Player 2 */}
                        <div className={cn("text-left flex-1 md:flex-none md:w-32 transition-colors", match.winnerId === match.player2Id ? "text-white font-bold" : "text-slate-400 font-medium")}>
                            {match.player2.name.split(' ')[0]}
                        </div>
                    </div>

                    {/* Meta & Status */}
                    <div className="flex items-center justify-between md:justify-end gap-4 w-full border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                        <div className="md:hidden text-xs text-slate-500">
                            {new Date(match.date).toLocaleDateString()}
                        </div>

                        {isPending ? (
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-amber-500 animate-pulse">AWAITING VALIDATION</span>
                                <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all">
                                    CONFIRM
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-emerald-500/80">
                                <CheckCircle2 size={16} />
                                <span className="text-xs font-bold">VALIDATED</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
