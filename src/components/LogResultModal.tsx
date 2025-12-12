"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, Loader2 } from "lucide-react";

interface LogResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: { id: string; name: string | null; email: string }[];
    currentUserId: string;
}

export default function LogResultModal({ isOpen, onClose, users, currentUserId }: LogResultModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [opponentId, setOpponentId] = useState("");
    const [games, setGames] = useState([{ p1: "", p2: "" }]);

    if (!isOpen) return null;

    const addGame = () => {
        if (games.length < 5) {
            setGames([...games, { p1: "", p2: "" }]);
        }
    };

    const removeGame = (index: number) => {
        if (games.length > 1) {
            setGames(games.filter((_, i) => i !== index));
        }
    };

    const updateGame = (index: number, field: "p1" | "p2", value: string) => {
        const newGames = [...games];
        newGames[index][field] = value;
        setGames(newGames);
    };

    const handleSubmit = async () => {
        if (!opponentId) {
            setError("Please select an opponent");
            return;
        }

        const validGames = games.filter(g => g.p1 !== "" && g.p2 !== "");
        if (validGames.length === 0) {
            setError("Please enter at least one game score");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/matches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    opponentId,
                    scores: validGames.map(g => ({
                        p1: parseInt(g.p1),
                        p2: parseInt(g.p2),
                    })),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to log match");
            } else {
                onClose();
                setOpponentId("");
                setGames([{ p1: "", p2: "" }]);
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const opponents = users.filter(u => u.id !== currentUserId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Log Match Result</h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                                Opponent
                            </label>
                            <select
                                value={opponentId}
                                onChange={(e) => setOpponentId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select opponent...</option>
                                {opponents.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name || user.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
                                    Game Scores
                                </label>
                                <button
                                    onClick={addGame}
                                    disabled={games.length >= 5}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
                                >
                                    <Plus size={14} /> Add Game
                                </button>
                            </div>

                            <div className="space-y-2">
                                {games.map((game, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 w-6">#{index + 1}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="99"
                                            value={game.p1}
                                            onChange={(e) => updateGame(index, "p1", e.target.value)}
                                            placeholder="You"
                                            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <span className="text-slate-500">-</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="99"
                                            value={game.p2}
                                            onChange={(e) => updateGame(index, "p2", e.target.value)}
                                            placeholder="Opp"
                                            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {games.length > 1 && (
                                            <button
                                                onClick={() => removeGame(index)}
                                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-xs text-slate-500">
                            Your opponent will need to verify this result before ELO is updated.
                        </p>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                            Submit Match
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
