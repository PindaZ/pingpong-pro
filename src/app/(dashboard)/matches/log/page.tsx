"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Trophy, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LogMatchPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [opponentId, setOpponentId] = useState("");
    // Fixed 3 sets for now or dynamic? Let's do dynamic sets
    const [scores, setScores] = useState([{ p1: 0, p2: 0 }]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        // Fetch users for opponent selection
        // In a real app we'd also fetch current user to exclude them, 
        // but the API could just return others or we filter client side if we know current ID.
        // Ideally we fetch 'others'.
        // For now, let's just fetch all and filter out 'me' if possible, or just list everyone (MVP).
        // Actually, get /api/users returns everyone.

        // We also need to know 'who am I' to display properly.
        // We can get this from session but easier to just assume the user knows who they are
        // or fetch from an endpoint.

        // Let's implement /api/users/me later or just rely on the user picking "Opponent" 
        // and we assume "Player 1" is "Me".

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/users");
                const data = await res.json();
                setUsers(data);
                // We'll filter out the current user if we can, but we don't have ID here easily without session prop or another call.
                // MVP: Just list all, user picks opponent.
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);

    const addSet = () => {
        setScores([...scores, { p1: 0, p2: 0 }]);
    }

    const removeSet = (index: number) => {
        if (scores.length > 1) {
            setScores(scores.filter((_, i) => i !== index));
        }
    }

    const updateScore = (index: number, player: 'p1' | 'p2', val: number) => {
        const newScores = [...scores];
        newScores[index][player] = Math.max(0, val);
        setScores(newScores);
    }

    const handleSubmit = async () => {
        if (!opponentId) return;
        setSubmitting(true);

        try {
            const res = await fetch("/api/matches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    opponentId,
                    scores
                })
            });

            if (res.ok) {
                router.push("/matches");
                router.refresh();
            } else {
                console.error("Failed to log match");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Log Match Result</h2>
                <p className="text-slate-400 mt-1">Submit scores for a recent game.</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-8">

                {/* Opponent Selection */}
                <div className="space-y-4">
                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Select Opponent</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {loading ? (
                            <div className="col-span-3 py-4 text-center text-slate-500">Loading players...</div>
                        ) : (
                            users.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => setOpponentId(user.id)}
                                    className={cn(
                                        "flex flex-col items-center p-3 rounded-xl border transition-all",
                                        opponentId === user.id
                                            ? "bg-indigo-600/20 border-indigo-500 text-white"
                                            : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800"
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                                        <User size={20} />
                                    </div>
                                    <span className="text-sm font-medium truncate w-full text-center">{user.name}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Score Entry */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Score (Sets)</label>
                        <button onClick={addSet} className="text-xs font-bold text-primary hover:text-indigo-300 flex items-center gap-1">
                            <Plus size={14} /> ADD SET
                        </button>
                    </div>

                    <div className="space-y-3">
                        {scores.map((set, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <span className="text-xs font-mono text-slate-500 w-12">SET {idx + 1}</span>

                                <div className="flex-1 flex items-center gap-3">
                                    <div className="flex-1 flex items-center gap-2 bg-slate-950/50 border border-slate-700 rounded-lg p-1">
                                        <span className="text-[10px] font-bold text-slate-500 px-2">YOU</span>
                                        <input
                                            type="number"
                                            value={set.p1}
                                            onChange={(e) => updateScore(idx, 'p1', parseInt(e.target.value) || 0)}
                                            className="w-full bg-transparent text-center font-mono font-bold text-white focus:outline-none"
                                        />
                                    </div>
                                    <span className="text-slate-600 font-bold">:</span>
                                    <div className="flex-1 flex items-center gap-2 bg-slate-950/50 border border-slate-700 rounded-lg p-1">
                                        <span className="text-[10px] font-bold text-slate-500 px-2">OPP</span>
                                        <input
                                            type="number"
                                            value={set.p2}
                                            onChange={(e) => updateScore(idx, 'p2', parseInt(e.target.value) || 0)}
                                            className="w-full bg-transparent text-center font-mono font-bold text-white focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {scores.length > 1 && (
                                    <button onClick={() => removeSet(idx)} className="p-2 text-slate-600 hover:text-red-400">
                                        <Minus size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <div className="pt-4 border-t border-slate-800">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !opponentId}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={20} /> : "Submit Match Log"}
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-3">
                        Result will be pending until confirmed by opponent.
                    </p>
                </div>

            </div>
        </div>
    );
}
