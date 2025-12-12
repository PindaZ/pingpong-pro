import { Trophy, Calendar, Users, ArrowRight, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TournamentsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const tournaments = await db.tournament.findMany({
        orderBy: { startDate: 'desc' },
        include: {
            winner: true,
            _count: {
                select: { participants: true }
            }
        }
    });

    const featuredTournament = tournaments.find(t => t.status === 'ONGOING' || t.status === 'UPCOMING');
    const pastTournaments = tournaments.filter(t => t.id !== featuredTournament?.id);

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Tournaments</h2>
                <p className="text-slate-400 mt-1">Compete for glory and climb the ranks.</p>
            </div>

            {/* Featured Tournament (Hero Card) */}
            {featuredTournament && (
                <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="grid lg:grid-cols-2 gap-8 relative z-10 p-8 md:p-10">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-sm font-semibold">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                {featuredTournament.status}
                            </div>

                            <div>
                                <h3 className="text-4xl font-bold text-white mb-2 tracking-tight">{featuredTournament.name}</h3>
                                <p className="text-slate-400 text-lg">Join the ultimate showdown. Prove your skills and claim the championship title.</p>
                            </div>

                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Date</div>
                                        <div className="text-slate-200 font-semibold">{new Date(featuredTournament.startDate).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Participants</div>
                                        <div className="text-slate-200 font-semibold">{featuredTournament._count.participants} / 32</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-amber-400">
                                        <Trophy size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Prize</div>
                                        <div className="text-slate-200 font-semibold">Glory & Honor</div>
                                    </div>
                                </div>
                            </div>

                            <button className="px-8 py-4 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition-colors shadow-xl shadow-white/5 active:scale-95">
                                Join Tournament
                            </button>
                        </div>

                        {/* Bracket Visual (Static Preview) */}
                        <div className="hidden lg:flex items-center justify-center relative">
                            <div className="w-full max-w-md aspect-video bg-slate-950/50 rounded-2xl border border-slate-800 p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
                                {/* Fake Bracket Lines */}
                                <div className="absolute inset-0 flex items-center justify-between px-10 opacity-30">
                                    <div className="flex flex-col justify-around h-full py-4">
                                        <div className="w-24 h-8 bg-slate-800 rounded mb-4" />
                                        <div className="w-24 h-8 bg-slate-800 rounded mb-4" />
                                        <div className="w-24 h-8 bg-slate-800 rounded mb-4" />
                                        <div className="w-24 h-8 bg-slate-800 rounded" />
                                    </div>
                                    <div className="flex flex-col justify-around h-full py-8">
                                        <div className="w-24 h-8 bg-slate-800 rounded mb-8" />
                                        <div className="w-24 h-8 bg-slate-800 rounded" />
                                    </div>
                                    <div className="flex flex-col justify-center h-full">
                                        <div className="w-28 h-10 bg-indigo-600 rounded shadow-lg shadow-indigo-500/20" />
                                    </div>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="px-4 py-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg text-slate-300 font-medium text-sm">
                                        View Bracket
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Past Tournaments Grid */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white">Past Events</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastTournaments.length === 0 ? (
                        <div className="col-span-3 text-center py-12 text-slate-500">No past tournaments found.</div>
                    ) : (
                        pastTournaments.map((tournament) => (
                            <TournamentCard key={tournament.id} tournament={tournament} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function TournamentCard({ tournament }: any) {
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-slate-800/80 text-slate-400 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                        <Trophy size={20} />
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-400 border border-slate-700/50">
                        {tournament.status}
                    </span>
                </div>

                <h4 className="text-lg font-bold text-white mb-2">{tournament.name}</h4>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                    <Calendar size={14} />
                    <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-slate-500" />
                        <span className="text-sm font-medium text-slate-300">{tournament._count?.participants || 0} Players</span>
                    </div>
                    {tournament.winner && (
                        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/10">
                            <Crown size={12} className="text-amber-500" />
                            <span className="text-xs font-bold text-amber-500">{tournament.winner.name}</span>
                        </div>
                    )}
                    {!tournament.winner && <ArrowRight size={16} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />}
                </div>
            </div>
        </div>
    )
}

function Crown({ size, className }: any) {
    return <Medal size={size} className={className} />
}
