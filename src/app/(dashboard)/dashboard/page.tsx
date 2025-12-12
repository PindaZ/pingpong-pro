import { TrendingUp, Award, Activity } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { calculateWins, calculateLosses, calculateWinRate } from "@/lib/stats";
import { StatCard } from "@/components/ui/StatCard";
import { MatchItem } from "@/components/ui/MatchItem";
import { LeaderboardItem } from "@/components/ui/LeaderboardItem";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const currentUser = await db.user.findUnique({
        where: { id: session.user.id },
        include: {
            matchesWon: true,
            matchesAsPlayer1: true,
            matchesAsPlayer2: true,
        }
    });

    if (!currentUser) redirect("/login");

    const sortedUsers = await db.user.findMany({
        orderBy: { elo: 'desc' },
        take: 5
    });

    const recentMatches = await db.match.findMany({
        take: 5,
        orderBy: { playedAt: 'desc' },
        include: {
            player1: true,
            player2: true,
            winner: true,
            games: true,
        }
    });

    // Calculate Rank
    const rank = await db.user.count({
        where: { elo: { gt: currentUser.elo } }
    }) + 1;

    // Calculate Trend
    const lastMatch = recentMatches.find(m => m.player1Id === currentUser.id || m.player2Id === currentUser.id);
    const trend = lastMatch ? (lastMatch.winnerId === currentUser.id ? "+ Win" : "- Loss") : "Stable";

    // Stats using helper functions
    const wins = calculateWins(currentUser);
    const losses = calculateLosses(currentUser);
    const winRate = calculateWinRate(currentUser);

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard</h2>
                    <p className="text-slate-400 mt-1">Welcome back, {currentUser.name}</p>
                </div>
                <div className="flex gap-2 text-sm">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <StatCard
                    title="Current ELO"
                    value={currentUser.elo.toString()}
                    icon={<TrendingUp className="text-white" size={24} />}
                    description={`Top ${(rank / 10 * 100).toFixed(0)}%`}
                    gradient="from-blue-600 to-indigo-600"
                    trend={trend}
                />
                <StatCard
                    title="Win Rate"
                    value={`${winRate}%`}
                    icon={<Activity className="text-white" size={24} />}
                    description={`${wins} W - ${losses} L`}
                    gradient="from-violet-600 to-purple-600"
                    trend="Lifetime"
                />
                <StatCard
                    title="Rank"
                    value={`#${rank}`}
                    icon={<Award className="text-white" size={24} />}
                    description="Season 1"
                    gradient="from-amber-500 to-orange-600"
                    trend="Global"
                />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Recent Matches */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-white">Recent Activity</h3>
                        <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View All</button>
                    </div>

                    <div className="space-y-4">
                        {recentMatches.length === 0 ? (
                            <div className="text-slate-500 italic">No matches played yet.</div>
                        ) : (
                            recentMatches.map((match) => (
                                <MatchItem key={match.id} match={match} currentUserId={currentUser.id} />
                            ))
                        )}
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="space-y-6">
                    <h3 className="font-semibold text-lg text-white">Top Players</h3>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="space-y-6">
                            {sortedUsers.map((user, idx) => (
                                <LeaderboardItem key={user.id} user={user} rank={idx + 1} />
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:bg-slate-800 hover:text-white transition-all">
                            View Full Rankings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
