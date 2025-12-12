"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Calendar, Users, ArrowLeft, Shield, Plus } from "lucide-react";
import TournamentBracket from "@/components/TournamentBracket";
import { cn } from "@/lib/utils";
import ManageParticipantsModal from "@/components/ManageParticipantsModal";

interface TournamentDetailClientProps {
    tournament: any;
    currentUserId: string;
    isAdmin: boolean;
}

export default function TournamentDetailClient({
    tournament,
    currentUserId,
    isAdmin,
}: TournamentDetailClientProps) {
    const router = useRouter();

    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);

    let status: "UPCOMING" | "ONGOING" | "COMPLETED";
    if (now < startDate) status = "UPCOMING";
    else if (now > endDate) status = "COMPLETED";
    else status = "ONGOING";

    const statusColors = {
        UPCOMING: "bg-sky-500/20 text-sky-400 border-sky-500/20",
        ONGOING: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
        COMPLETED: "bg-slate-500/20 text-slate-400 border-slate-500/20",
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-6">
            {/* Back Button */}
            <button
                onClick={() => router.push("/tournaments")}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={18} />
                Back to Tournaments
            </button>

            {/* Tournament Header */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-8">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Trophy size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{tournament.name}</h1>
                                <p className="text-slate-400 text-sm">Created by {tournament.creator?.name || "Admin"}</p>
                            </div>
                        </div>

                        {tournament.description && (
                            <p className="text-slate-400 max-w-2xl">{tournament.description}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm">
                            <span className={cn("px-3 py-1 rounded-full border font-medium", statusColors[status])}>
                                {status}
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-400">
                                <Calendar size={14} />
                                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-400">
                                <Users size={14} />
                                {tournament.participants.length} / {tournament.maxParticipants} participants
                            </span>
                            {tournament.bracketGenerated && (
                                <span className="flex items-center gap-1.5 text-indigo-400">
                                    <Shield size={14} />
                                    {tournament.seedingType} seeding
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Participants List (if bracket not generated) */}
            {!tournament.bracketGenerated && (tournament.participants.length > 0 || isAdmin) && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Registered Participants</h2>
                        {isAdmin && (
                            <button
                                onClick={() => setShowManageModal(true)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 text-sm font-semibold hover:bg-indigo-600/30 transition-colors border border-indigo-500/30 active:scale-95 flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Add Player
                            </button>
                        )}
                    </div>

                    {tournament.participants.length === 0 ? (
                        <p className="text-slate-500 italic text-sm">No participants yet.</p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {tournament.participants.map((p: any) => (
                                <div
                                    key={p.id}
                                    className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                                        {p.user.avatarUrl ? (
                                            <img src={p.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            p.user.name?.charAt(0)?.toUpperCase() || "?"
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{p.user.name}</p>
                                        <p className="text-xs text-slate-500">{p.user.elo} ELO</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <ManageParticipantsModal
                isOpen={showManageModal}
                onClose={() => setShowManageModal(false)}
                tournamentId={tournament.id}
                tournamentName={tournament.name}
                participants={tournament.participants || []}
            />

            {/* Bracket */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Tournament Bracket</h2>
                <TournamentBracket
                    tournamentId={tournament.id}
                    bracketMatches={tournament.bracketMatches}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    bracketGenerated={tournament.bracketGenerated}
                    onRefresh={() => router.refresh()}
                />
            </div>
        </div>
    );
}
