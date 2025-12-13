"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Trophy, User } from "lucide-react";

interface Player {
    id: string;
    name: string | null;
    avatarUrl?: string | null;
    elo?: number;
}

interface BracketMatch {
    id: string;
    player1: Player | null;
    player2: Player | null;
    round: number;
}

interface TournamentLogResultModalProps {
    match: BracketMatch | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tournamentId: string;
    currentUserId: string;
}

export default function TournamentLogResultModal({
    match,
    isOpen,
    onClose,
    onSuccess,
    tournamentId,
    currentUserId
}: TournamentLogResultModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);

    if (!isOpen || !match) return null;

    const isPlayer1 = match.player1?.id === currentUserId;
    const opponent = isPlayer1 ? match.player2 : match.player1;
    const me = isPlayer1 ? match.player1 : match.player2;

    const handleSubmit = async () => {
        if (!selectedWinnerId) {
            setError("Please select who won the match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/tournaments/${tournamentId}/bracket/${match.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    winnerId: selectedWinnerId
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error || "Failed to log match result");
            } else {
                onSuccess();
                onClose();
                setSelectedWinnerId(null);
                router.refresh();
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectWinner = (id: string) => {
        setSelectedWinnerId(id);
        setError("");
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col">
                <div className="p-6 flex-none border-b border-slate-800">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">Who Won?</h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {/* Me Card */}
                        <button
                            onClick={() => handleSelectWinner(currentUserId)}
                            className={`relative group p-6 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-4 ${selectedWinnerId === currentUserId
                                    ? "bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/20"
                                    : "bg-slate-950/50 border-slate-800 hover:border-slate-600 hover:bg-slate-900"
                                }`}
                        >
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden transition-transform group-hover:scale-105 ${selectedWinnerId === currentUserId ? "ring-4 ring-indigo-500/30" : ""
                                }`}>
                                {me?.avatarUrl ? (
                                    <img src={me.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white">
                                        {me?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-lg text-white mb-1">Me</div>
                                <div className="text-xs text-slate-400">Select if you won</div>
                            </div>
                            {selectedWinnerId === currentUserId && (
                                <div className="absolute top-3 right-3 bg-indigo-500 text-white p-1 rounded-full">
                                    <Trophy size={16} />
                                </div>
                            )}
                        </button>

                        {/* Opponent Card */}
                        <button
                            onClick={() => handleSelectWinner(opponent?.id || "")}
                            className={`relative group p-6 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-4 ${selectedWinnerId === opponent?.id
                                    ? "bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/20"
                                    : "bg-slate-950/50 border-slate-800 hover:border-slate-600 hover:bg-slate-900"
                                }`}
                        >
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden transition-transform group-hover:scale-105 ${selectedWinnerId === opponent?.id ? "ring-4 ring-indigo-500/30" : ""
                                }`}>
                                {opponent?.avatarUrl ? (
                                    <img src={opponent.avatarUrl} alt="Opponent" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white">
                                        {opponent?.name?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-lg text-white mb-1">{opponent?.name || "Opponent"}</div>
                                <div className="text-xs text-slate-400">Select if they won</div>
                            </div>
                            {selectedWinnerId === opponent?.id && (
                                <div className="absolute top-3 right-3 bg-indigo-500 text-white p-1 rounded-full">
                                    <Trophy size={16} />
                                </div>
                            )}
                        </button>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedWinnerId}
                        className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : "Submit Result"}
                    </button>
                    <p className="text-xs text-center text-slate-500 mt-4">
                        Result will be verified by your opponent.
                    </p>
                </div>
            </div>
        </div>
    );
}
