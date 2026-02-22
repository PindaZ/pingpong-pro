import Link from "next/link";
import { TrendingUp, Award, Activity, Flame, Swords, Trophy } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { calculateWins, calculateLosses, calculateWinRate } from "@/lib/stats";
import { StatCard } from "@/components/ui/StatCard";
import { MatchItem } from "@/components/ui/MatchItem";
import { LeaderboardItem } from "@/components/ui/LeaderboardItem";
import { EloHistoryChart } from "@/components/EloHistoryChart";

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
        where: {
            status: { in: ['VALIDATED', 'REJECTED'] }
        },
        take: 5,
        orderBy: { playedAt: 'desc' },
        include: {
            player1: true,
            player2: true,
            winner: true,
            games: true,
        }
    });

    // Fetch Active Challenges (ACCEPTED status)
    const activeMissions = await db.match.findMany({
        where: {
            status: 'ACCEPTED',
            OR: [
                { player1Id: currentUser.id },
                { player2Id: currentUser.id }
            ]
        },
        include: {
            player1: true,
            player2: true,
            games: true,
        },
        orderBy: { updatedAt: 'desc' }
    });

    // Fetch ELO History
    const rankingLogs = await db.rankingLog.findMany({
        where: { userId: currentUser.id },
        orderBy: { createdAt: 'asc' },
        take: 50
    });

    // Format for Chart
    const eloHistoryData = rankingLogs.map(log => ({
        date: log.createdAt,
        elo: log.eloAfter
    }));

    // Add current ELO if history is empty or last log significantly different (not strictly necessary but good for fresh data)
    // Actually, simple is best. If no logs, maybe show just current.
    if (eloHistoryData.length === 0) {
        eloHistoryData.push({ date: new Date(), elo: currentUser.elo });
    }

    // Calculate Longest Streak
    const allMatches = await db.match.findMany({
        where: {
            OR: [
                { player1Id: currentUser.id },
                { player2Id: currentUser.id }
            ],
            status: 'VALIDATED'
        },
        orderBy: { playedAt: 'asc' }
    });

    let currentStreak = 0;
    let longestStreak = 0;

    for (const match of allMatches) {
        if (match.winnerId === currentUser.id) {
            currentStreak++;
            if (currentStreak > longestStreak) longestStreak = currentStreak;
        } else {
            currentStreak = 0;
        }
    }

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
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
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
                <StatCard
                    title="Best Streak"
                    value={`${longestStreak}`}
                    icon={<Flame className="text-white" size={24} />}
                    description="Consecutive Wins"
                    gradient="from-rose-500 to-red-600"
                    trend="Personal Best"
                />
            </div>

            {/* ELO Graph */}
            <div className="w-full">
                <EloHistoryChart data={eloHistoryData} />
            </div>

            {/* Active Missions (ACCEPTED Challenges) */}
            {activeMissions.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Swords className="text-primary" size={24} />
                        <h3 className="font-bold text-xl text-white uppercase tracking-tight">Active Missions</h3>
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black border border-primary/20 animate-pulse">
                            TO_PLAY: {activeMissions.length}
                        </span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {activeMissions.map((mission) => {
                            const isPlayer1 = mission.player1Id === currentUser.id;
                            const opponent = isPlayer1 ? mission.player2 : mission.player1;
                            return (
                                <div key={mission.id} className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 backdrop-blur-md p-5 flex items-center justify-between group hover:border-primary/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-primary border border-primary/20">
                                            <Trophy size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CHALLENGE_ACCEPTED</p>
                                            <p className="text-white font-bold uppercase tracking-tight">vs {opponent.name}</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href={`/matches/log?opponentId=${opponent.id}&matchId=${mission.id}`}
                                        className="px-4 py-2 bg-primary text-white text-[10px] font-black rounded-lg shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
                                    >
                                        LOG RESULT
                                    </Link>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Recent Matches */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-white">Recent Activity</h3>
                        <Link href="/matches" className="text-sm text-primary hover:text-indigo-300 transition-colors">View All</Link>
                    </div>

                    <div className="space-y-4">
                        {recentMatches.length === 0 ? (
                            <div className="text-slate-500 italic">No matches played yet.</div>
                        ) : (
                            recentMatches.map((match) => (
                                <Link key={match.id} href="/matches">
                                    <MatchItem match={match} currentUserId={currentUser.id} />
                                </Link>
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
                        <Link href="/rankings" className="w-full mt-6 py-3 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:bg-slate-800 hover:text-white transition-all text-center block">
                            View Full Rankings
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
