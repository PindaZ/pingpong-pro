import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function RankingsPage({
    searchParams,
}: {
    searchParams: Promise<{ period?: string }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { period } = await searchParams;
    const isYearly = period === "yearly";
    const currentYear = new Date().getFullYear();

    const users = await db.user.findMany({
        include: {
            matchesWon: true,
            matchesAsPlayer1: true,
            matchesAsPlayer2: true,
        }
    });

    // Sort users
    const sortedUsers = users.map(user => {
        const wins = user.matchesWon.length;
        const totalMatches = user.matchesAsPlayer1.length + user.matchesAsPlayer2.length;
        const losses = totalMatches - wins;
        const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

        // Yearly stats
        const yearlyWins = user.matchesWon.filter(m => new Date(m.playedAt).getFullYear() === currentYear).length;
        const yearlyMatches = [...user.matchesAsPlayer1, ...user.matchesAsPlayer2].filter(m => new Date(m.playedAt).getFullYear() === currentYear).length;
        const yearlyLosses = yearlyMatches - yearlyWins;
        const yearlyWinRate = yearlyMatches > 0 ? Math.round((yearlyWins / yearlyMatches) * 100) : 0;

        return {
            ...user,
            stats: {
                wins: isYearly ? yearlyWins : wins,
                losses: isYearly ? yearlyLosses : losses,
                winRate: isYearly ? yearlyWinRate : winRate,
                totalMatches: isYearly ? yearlyMatches : totalMatches
            }
        };
    }).sort((a, b) => {
        if (isYearly) {
            // Sort by yearly wins, then win rate
            if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
            return b.stats.winRate - a.stats.winRate;
        }
        // Default: Sort by ELO
        return b.elo - a.elo;
    });

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Rankings</h2>
                    <p className="text-slate-400 mt-1">
                        {isYearly ? `Top players of ${currentYear}` : "All-time leaderboard sorted by ELO"}
                    </p>
                </div>

                <div className="bg-slate-900/50 p-1 rounded-xl border border-slate-800 flex items-center">
                    <Link
                        href="/rankings?period=all-time"
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            !isYearly ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white"
                        )}
                    >
                        All Time
                    </Link>
                    <Link
                        href="/rankings?period=yearly"
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            isYearly ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white"
                        )}
                    >
                        {currentYear} Season
                    </Link>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-5">Player</div>
                    <div className="col-span-2 text-center">{isYearly ? "Wins" : "ELO"}</div>
                    <div className="col-span-2 text-center">W/L</div>
                    <div className="col-span-2 text-center">Win Rate</div>
                </div>

                {/* Players */}
                <div className="divide-y divide-slate-800/50">
                    {sortedUsers.map((user, idx) => {
                        return (
                            <div
                                key={user.id}
                                className={cn(
                                    "grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-slate-800/30",
                                    idx < 3 && "bg-gradient-to-r from-slate-800/20 to-transparent"
                                )}
                            >
                                {/* Rank */}
                                <div className="col-span-1">
                                    {idx === 0 ? (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                            <Trophy size={16} className="text-white" />
                                        </div>
                                    ) : idx === 1 ? (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-lg">
                                            <Medal size={16} className="text-white" />
                                        </div>
                                    ) : idx === 2 ? (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg">
                                            <Medal size={16} className="text-white" />
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 font-mono text-sm pl-2">#{idx + 1}</span>
                                    )}
                                </div>

                                {/* Player */}
                                <div className="col-span-5">
                                    <Link href={`/profile/${user.id}`} className="flex items-center gap-3 group">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold group-hover:ring-2 group-hover:ring-indigo-400 transition-all">
                                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{user.name || "Anonymous"}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </Link>
                                </div>

                                {/* Main Metric (ELO or Wins) */}
                                <div className="col-span-2 text-center">
                                    <span className={cn(
                                        "font-mono font-bold text-lg",
                                        idx === 0 ? "text-amber-400" : idx < 3 ? "text-slate-200" : "text-slate-400"
                                    )}>
                                        {isYearly ? user.stats.wins : user.elo}
                                    </span>
                                </div>

                                {/* W/L */}
                                <div className="col-span-2 text-center">
                                    <span className="text-emerald-400 font-medium">{user.stats.wins}</span>
                                    <span className="text-slate-600 mx-1">/</span>
                                    <span className="text-red-400 font-medium">{user.stats.losses}</span>
                                </div>

                                {/* Win Rate */}
                                <div className="col-span-2 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        {user.stats.winRate > 50 ? (
                                            <TrendingUp size={14} className="text-emerald-400" />
                                        ) : user.stats.winRate < 50 ? (
                                            <TrendingDown size={14} className="text-red-400" />
                                        ) : (
                                            <Minus size={14} className="text-slate-500" />
                                        )}
                                        <span className={cn(
                                            "font-medium",
                                            user.stats.winRate > 50 ? "text-emerald-400" : user.stats.winRate < 50 ? "text-red-400" : "text-slate-400"
                                        )}>
                                            {user.stats.winRate}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {sortedUsers.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        No players found.
                    </div>
                )}
            </div>
        </div>
    );
}
