"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, UserPlus, UserMinus, Plus } from "lucide-react";

interface ManageParticipantsModalProps {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
    tournamentName: string;
    participants: any[]; // Using any[] for simplicity, ideally formatted
}

export default function ManageParticipantsModal({
    isOpen,
    onClose,
    tournamentId,
    tournamentName,
    participants,
}: ManageParticipantsModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [userIdToAdd, setUserIdToAdd] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    if (!isOpen) return null;

    const handleAction = async (action: "add" | "remove", userId: string) => {
        setLoading(true);
        setError("");
        setSuccessMsg("");

        try {
            const res = await fetch(`/api/tournaments/${tournamentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, userId }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to manage participant");
            } else {
                setSuccessMsg(data.message || "Success");
                if (action === "add") setUserIdToAdd("");
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">Manage Participants</h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{tournamentName}</p>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                            {successMsg}
                        </div>
                    )}

                    {/* Add Player */}
                    <div className="mb-8">
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                            Add Participant (User ID)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={userIdToAdd}
                                onChange={(e) => setUserIdToAdd(e.target.value)}
                                placeholder="Enter User ID..."
                                className="flex-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={() => handleAction("add", userIdToAdd)}
                                disabled={loading || !userIdToAdd}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                Add
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            * Provide the exact ID of the user you want to add.
                        </p>
                    </div>

                    {/* List Participants */}
                    <div>
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            Current Participants
                            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                                {participants?.length || 0}
                            </span>
                        </h4>

                        {participants && participants.length > 0 ? (
                            <div className="space-y-2">
                                {participants.map((p) => (
                                    <div key={p.userId} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                                                {p.seed || "?"}
                                            </div>
                                            <div className="text-sm text-slate-200 font-mono">
                                                {p.userId.substring(0, 8)}...
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAction("remove", p.userId)}
                                            disabled={loading}
                                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Remove participant"
                                        >
                                            <UserMinus size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic text-center py-4">
                                No participants yet.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
