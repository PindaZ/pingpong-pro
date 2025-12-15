import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Swords } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ChallengeButton from "@/components/ChallengeButton";

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const user = await db.user.findUnique({
        where: { id },
        include: {
            matchesWon: true,
            matchesAsPlayer1: {
                include: { player1: true, player2: true, winner: true, games: true },
                orderBy: { playedAt: 'desc' },
                take: 10
            },
            matchesAsPlayer2: {
                include: { player1: true, player2: true, winner: true, games: true },
                orderBy: { playedAt: 'desc' },
                take: 10
            },
        }
    });

    if (!user) {
        return notFound();
    }

    const wins = user.matchesWon.length;
    const totalMatches = user.matchesAsPlayer1.length + user.matchesAsPlayer2.length;
    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // Get rank
    const rank = await db.user.count({
        where: { elo: { gt: user.elo } }
    }) + 1;

    const totalUsers = await db.user.count();

    // Combine recent matches and sort
    const recentMatches = [...user.matchesAsPlayer1, ...user.matchesAsPlayer2]
        .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
        .slice(0, 10);

    // Get current session to check if viewing own profile
    const session = await getServerSession(authOptions);
    const isOwnProfile = session?.user?.id === id;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Player Profile</h2>
                <p className="text-slate-400 mt-1">Viewing stats and history</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-white text-3xl font-bold mb-4 ring-4 ring-primary-20 overflow-hidden relative">
                                {user.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.name || "Profile"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    user.name?.charAt(0)?.toUpperCase() || "?"
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-white">{user.name || "Anonymous"}</h3>
                            <p className="text-slate-500 text-sm mt-1">{user.email}</p>
                            {user.bio && (
                                <p className="text-slate-400 text-sm mt-3 italic">&quot;{user.bio}&quot;</p>
                            )}
                        </div>

                        <div className="space-y-4 border-t border-slate-800 pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">ELO Rating</span>
                                <span className="font-mono font-bold text-primary">{user.elo}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">Global Rank</span>
                                <span className="font-bold text-white">#{rank} <span className="text-slate-500 text-xs">of {totalUsers}</span></span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">Role</span>
                                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-primary text-xs font-semibold uppercase">{user.role}</span>
                            </div>
                        </div>
                    </div>

                    {/* Mini Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-emerald-400">{wins}</div>
                            <div className="text-xs text-slate-500">Wins</div>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-red-400">{losses}</div>
                            <div className="text-xs text-slate-500">Losses</div>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-primary">{winRate}%</div>
                            <div className="text-xs text-slate-500">Win Rate</div>
                        </div>
                    </div>

                    {/* Challenge Button */}
                    {!isOwnProfile && session && (
                        <ChallengeButton challengedUserId={id} challengedUserName={user.name || "Player"} />
                    )}
                </div>

                {/* Match History */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Swords size={18} className="text-primary" />
                            Recent Matches
                        </h4>

                        {recentMatches.length === 0 ? (
                            <p className="text-slate-500 text-center py-4">No matches played yet</p>
                        ) : (
                            <div className="space-y-3">
                                {recentMatches.map((match) => {
                                    const isPlayer1 = match.player1Id === user.id;
                                    const opponent = isPlayer1 ? match.player2 : match.player1;
                                    const won = match.winnerId === user.id;

                                    return (
                                        <div key={match.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${won ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                <span className="text-white font-medium">vs {opponent?.name || "Unknown"}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-slate-400 text-sm">
                                                    {new Date(match.playedAt).toLocaleDateString()}
                                                </span>
                                                <span className={`text-xs font-bold ${won ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {won ? 'WON' : 'LOST'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
