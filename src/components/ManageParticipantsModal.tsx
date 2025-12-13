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
    const [successMsg, setSuccessMsg] = useState("");

    // Search State
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    // Debounce search
    const handleSearch = async (val: string) => {
        setQuery(val);
        setSelectedUser(null);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(val)}`);
            const data = await res.json();
            setSearchResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectUser = (user: any) => {
        setSelectedUser(user);
        setQuery(user.name || user.email);
        setSearchResults([]);
    };

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
                if (action === "add") {
                    setQuery("");
                    setSelectedUser(null);
                }
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

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative" style={{ minHeight: "300px" }}>
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

                    {/* Add Player Search */}
                    <div className="mb-8 relative z-50">
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                            Add Participant
                        </label>
                        <div className="flex gap-2 relative">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {searching && (
                                    <div className="absolute right-3 top-2.5">
                                        <Loader2 className="animate-spin text-slate-500" size={16} />
                                    </div>
                                )}

                                {/* Dropdown Results */}
                                {searchResults.length > 0 && !selectedUser && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                                        {searchResults.map(user => {
                                            const isAlreadyAdded = participants?.some(p => p.user?.id === user.id || p.userId === user.id);
                                            return (
                                                <button
                                                    key={user.id}
                                                    onClick={() => !isAlreadyAdded && handleSelectUser(user)}
                                                    disabled={isAlreadyAdded}
                                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
                                                        {user.avatarUrl ? (
                                                            <img src={user.avatarUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                                                                {user.name?.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">{user.name}</div>
                                                        <div className="text-xs text-slate-500">{user.email}</div>
                                                    </div>
                                                    {isAlreadyAdded && <span className="ml-auto text-xs text-emerald-500">Joined</span>}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => selectedUser && handleAction("add", selectedUser.id)}
                                disabled={loading || !selectedUser}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                Add
                            </button>
                        </div>
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
                                            <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                                                {p.user?.avatarUrl ? (
                                                    <img src={p.user.avatarUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                                        {p.user?.name?.charAt(0) || p.userId.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">
                                                    {p.user?.name || "Unknown User"}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    Seed #{p.seed}
                                                </div>
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
