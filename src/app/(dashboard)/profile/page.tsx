import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Trophy, Swords, TrendingUp, Edit2, User, Mail, FileText, Award } from "lucide-react";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: {
            matchesWon: true,
            matchesAsPlayer1: {
                include: { player1: true, player2: true, winner: true, games: true },
                orderBy: { playedAt: 'desc' },
                take: 5
            },
            matchesAsPlayer2: {
                include: { player1: true, player2: true, winner: true, games: true },
                orderBy: { playedAt: 'desc' },
                take: 5
            },
        }
    });

    if (!user) redirect("/login");

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
        .slice(0, 5);

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">My Profile</h2>
                <p className="text-slate-400 mt-1">Manage your account and view your stats</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4 ring-4 ring-indigo-500/20">
                                {user.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <h3 className="text-xl font-bold text-white">{user.name || "Anonymous"}</h3>
                            <p className="text-slate-400 text-sm">{user.email}</p>
                            {user.bio && (
                                <p className="text-slate-500 text-sm mt-2 italic">&quot;{user.bio}&quot;</p>
                            )}
                        </div>

                        <div className="space-y-4 border-t border-slate-800 pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">ELO Rating</span>
                                <span className="font-mono font-bold text-indigo-400">{user.elo}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">Global Rank</span>
                                <span className="font-bold text-white">#{rank} <span className="text-slate-500 text-xs">of {totalUsers}</span></span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">Role</span>
                                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-xs font-semibold">{user.role}</span>
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
                            <div className="text-lg font-bold text-indigo-400">{winRate}%</div>
                            <div className="text-xs text-slate-500">Win Rate</div>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Form & Recent Matches */}
                <div className="md:col-span-2 space-y-6">
                    {/* Edit Profile */}
                    <ProfileForm user={{ id: user.id, name: user.name, bio: user.bio }} />

                    {/* Recent Matches */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Swords size={18} className="text-indigo-400" />
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
                                        <div key={match.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
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
