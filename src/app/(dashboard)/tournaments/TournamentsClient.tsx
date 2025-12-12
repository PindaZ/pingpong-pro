"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Calendar, Users, ArrowRight, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import CreateTournamentModal from "@/components/CreateTournamentModal";

interface TournamentsClientProps {
    tournaments: any[];
    currentUserId: string;
    isAdmin: boolean;
}

export default function TournamentsClient({ tournaments, currentUserId, isAdmin }: TournamentsClientProps) {
    const router = useRouter();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joining, setJoining] = useState<string | null>(null);

    const now = new Date();

    // Compute status based on dates
    const tournamentsWithStatus = tournaments.map((t) => {
        let status: "UPCOMING" | "ONGOING" | "COMPLETED";
        if (now < new Date(t.startDate)) {
            status = "UPCOMING";
        } else if (now > new Date(t.endDate)) {
            status = "COMPLETED";
        } else {
            status = "ONGOING";
        }
        return { ...t, status };
    });

    const featuredTournament = tournamentsWithStatus.find(
        (t) => t.status === "ONGOING" || t.status === "UPCOMING"
    );
    const otherTournaments = tournamentsWithStatus.filter((t) => t.id !== featuredTournament?.id);

    const handleJoin = async (tournamentId: string) => {
        setJoining(tournamentId);
        try {
            const res = await fetch(`/api/tournaments/${tournamentId}`, {
                method: "POST",
            });
            if (res.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error("Join failed:", error);
        } finally {
            setJoining(null);
        }
    };

    return (
        <>
            <div className="space-y-10 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Tournaments</h2>
                        <p className="text-slate-400 mt-1">Compete for glory and climb the ranks.</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-sm font-semibold transition-all hover:scale-105"
                        >
                            <Plus size={18} />
                            Create Tournament
                        </button>
                    )}
                </div>

                {tournaments.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                            <Trophy size={48} className="text-slate-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No Tournaments Yet</h3>
                        <p className="text-slate-400 max-w-md mx-auto">
                            {isAdmin
                                ? "Create your first tournament to get started!"
                                : "Check back later for upcoming tournaments."}
                        </p>
                    </div>
                ) : (
                    <>
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
                                            <h3 className="text-4xl font-bold text-white mb-2 tracking-tight">
                                                {featuredTournament.name}
                                            </h3>
                                            <p className="text-slate-400 text-lg">
                                                Join the ultimate showdown. Prove your skills and claim the championship title.
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300">
                                                    <Calendar size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                                        Date
                                                    </div>
                                                    <div className="text-slate-200 font-semibold">
                                                        {new Date(featuredTournament.startDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300">
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                                        Participants
                                                    </div>
                                                    <div className="text-slate-200 font-semibold">
                                                        {featuredTournament._count?.participants || 0} /{" "}
                                                        {featuredTournament.maxParticipants || 16}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-amber-400">
                                                    <Trophy size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                                        Prize
                                                    </div>
                                                    <div className="text-slate-200 font-semibold">Glory & Honor</div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleJoin(featuredTournament.id)}
                                            disabled={joining === featuredTournament.id}
                                            className="px-8 py-4 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition-colors shadow-xl shadow-white/5 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {joining === featuredTournament.id ? (
                                                <Loader2 className="animate-spin" size={18} />
                                            ) : null}
                                            Join Tournament
                                        </button>
                                    </div>

                                    {/* Bracket Visual (Static Preview) */}
                                    <div className="hidden lg:flex items-center justify-center relative">
                                        <div className="w-full max-w-md aspect-video bg-slate-950/50 rounded-2xl border border-slate-800 p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
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

                        {/* Other Tournaments Grid */}
                        {otherTournaments.length > 0 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-white">
                                    {featuredTournament ? "Other Events" : "All Tournaments"}
                                </h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {otherTournaments.map((tournament) => (
                                        <TournamentCard
                                            key={tournament.id}
                                            tournament={tournament}
                                            onJoin={() => handleJoin(tournament.id)}
                                            joining={joining === tournament.id}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <CreateTournamentModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
        </>
    );
}

function TournamentCard({
    tournament,
    onJoin,
    joining,
}: {
    tournament: any;
    onJoin: () => void;
    joining: boolean;
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-slate-800/80 text-slate-400 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                        <Trophy size={20} />
                    </div>
                    <span
                        className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-semibold border",
                            tournament.status === "COMPLETED"
                                ? "bg-slate-800 text-slate-400 border-slate-700/50"
                                : tournament.status === "ONGOING"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                        )}
                    >
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
                        <span className="text-sm font-medium text-slate-300">
                            {tournament._count?.participants || 0} Players
                        </span>
                    </div>
                    {tournament.status === "COMPLETED" ? (
                        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/10">
                            <span className="text-xs font-bold text-emerald-500">COMPLETED</span>
                        </div>
                    ) : (
                        <button
                            onClick={onJoin}
                            disabled={joining}
                            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                        >
                            {joining ? <Loader2 className="animate-spin" size={14} /> : null}
                            Join <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
