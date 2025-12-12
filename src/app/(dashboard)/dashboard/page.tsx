import { TrendingUp, Award, Activity, ArrowUpRight, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

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

    // Calculate Trend (Simple logic for now)
    const lastMatch = recentMatches.find(m => m.player1Id === currentUser.id || m.player2Id === currentUser.id);
    const trend = lastMatch ? (lastMatch.winnerId === currentUser.id ? "+ Win" : "- Loss") : "Stable";


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

            {/* Stats Cards - Premium Gradients */}
            <div className="grid gap-6 md:grid-cols-3">
                <StatCard
                    title="Current ELO"
                    value={currentUser.elo.toString()}
                    icon={<TrendingUp className="text-white" size={24} />}
                    description={`Top ${(rank / 10 * 100).toFixed(0)}% `}
                    gradient="from-blue-600 to-indigo-600"
                    trend={trend}
                />
                <StatCard
                    title="Win Rate"
                    value={`${(() => {
                        const wins = currentUser.matchesWon?.length || 0;
                        const totalMatches = new Set([...currentUser.matchesAsPlayer1?.map(m => m.id) || [], ...currentUser.matchesAsPlayer2?.map(m => m.id) || []]).size;
                        return totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
                    })()}%`}
                    icon={<Activity className="text-white" size={24} />}
                    description={`${currentUser.matchesWon?.length || 0} W - ${(() => {
                        const wins = currentUser.matchesWon?.length || 0;
                        const totalMatches = new Set([...currentUser.matchesAsPlayer1?.map(m => m.id) || [], ...currentUser.matchesAsPlayer2?.map(m => m.id) || []]).size;
                        return totalMatches - wins;
                    })()} L`}
                    gradient="from-violet-600 to-purple-600"
                    trend="Lifetime"
                />
                <StatCard
                    title="Rank"
                    value={`#${rank} `}
                    icon={<Award className="text-white" size={24} />}
                    description="Season 1"
                    gradient="from-amber-500 to-orange-600"
                    trend="Global"
                />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Recent Matches - Card Style List */}
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

                {/* Leaderboard - Podium Style */}
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

function StatCard({ title, value, icon, description, gradient, trend }: any) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/50 backdrop-blur-md p-6 group transition-all hover:-translate-y-1 hover:border-slate-700">
            {/* Background glow for specific card */}
            <div className={cn("absolute top-0 right-0 w-[150px] h-[150px] opacity-10 blur-[60px] rounded-full bg-gradient-to-br", gradient)} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-3 rounded-xl shadow-lg bg-gradient-to-br", gradient)}>
                        {icon}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-800/50 px-2 py-1 rounded-full border border-slate-700/50">
                        {trend} <ArrowUpRight size={12} />
                    </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</div>
                <div className="text-sm text-slate-400 font-medium">{description}</div>
            </div>
        </div>
    )
}

function MatchItem({ match, currentUserId }: any) {
    // Adapter for DB match object to match UI expectation if needed
    // Match from DB has games[] instead of score[]
    // We display the score summary
    const isWinner = match.winnerId === currentUserId;

    // Calculate sets won
    let p1Sets = 0;
    let p2Sets = 0;
    match.games.forEach((g: any) => {
        if (g.scorePlayer1 > g.scorePlayer2) p1Sets++;
        else p2Sets++;
    });

    const isParticipant = match.player1.id === currentUserId || match.player2.id === currentUserId;

    return (
        <div className="group relative overflow-hidden bg-slate-900/40 border border-slate-800 rounded-2xl p-4 transition-all hover:bg-slate-800/60 hover:border-slate-700">
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                    {/* Date Badge */}
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-400 font-medium text-xs">
                        <span className="text-lg text-white font-bold">{new Date(match.playedAt).getDate()}</span>
                        <span>{new Date(match.playedAt).toLocaleString('default', { month: 'short' })}</span>
                    </div>

                    {/* Players */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <span className={cn("text-base font-semibold", match.winnerId === match.player1Id ? "text-white" : "text-slate-400")}>{match.player1.name}</span>
                            <span className="text-xs text-slate-600 font-medium">vs</span>
                            <span className={cn("text-base font-semibold", match.winnerId === match.player2Id ? "text-white" : "text-slate-400")}>{match.player2.name}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono flex gap-2">
                            {match.games.map((g: any, i: number) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800/50 border border-slate-700/30">{g.scorePlayer1}-{g.scorePlayer2}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {match.status === 'VALIDATED' ? (
                        <div className={cn("px-3 py-1 rounded-full text-xs font-bold border", isWinner ? "bg-green-500/10 text-green-400 border-green-500/20" : (match.winnerId ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-800 text-slate-400 border-slate-700"))}>
                            {isWinner ? "VICTORY" : (match.winnerId ? "DEFEAT" : "DRAW")}
                        </div>
                    ) : (
                        <div className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            PENDING
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function LeaderboardItem({ user, rank }: any) {
    let rankIcon;
    let rankColor = "text-slate-400 bg-slate-800 border-slate-700";

    if (rank === 1) {
        rankIcon = <Crown size={14} className="text-amber-400" fill="currentColor" />;
        rankColor = "text-amber-400 bg-amber-500/10 border-amber-500/20 ring-1 ring-amber-500/30";
    } else if (rank === 2) {
        rankIcon = <Medal size={14} className="text-slate-300" />;
        rankColor = "text-slate-300 bg-slate-400/10 border-slate-400/20 ring-1 ring-slate-400/30";
    } else if (rank === 3) {
        rankIcon = <Medal size={14} className="text-orange-400" />;
        rankColor = "text-orange-400 bg-orange-500/10 border-orange-500/20 ring-1 ring-orange-500/30";
    }

    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border shadow-sm transition-transform group-hover:scale-110", rankColor)}>
                    {rankIcon || rank}
                </div>
                <div>
                    <div className="font-medium text-slate-200 group-hover:text-white transition-colors">{user.name}</div>
                    <div className="text-xs text-slate-500">ELO {user.elo}</div>
                </div>
            </div>
            <div className="font-mono font-bold text-slate-300">{user.elo}</div>
        </div>
    )
}
