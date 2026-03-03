"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, Loader2, AlertTriangle, Save } from "lucide-react";
import RulesModal from "./RulesModal";

interface EditMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    match: any;
    users: { id: string; name: string | null; email: string }[];
    currentUserId: string;
}

import ResponsiveModal from "@/components/ui/ResponsiveModal";

// Reuse validation logic (could be extracted to utils)
function validateGameScore(p1: number, p2: number): string | null {
    const winner = Math.max(p1, p2);
    const loser = Math.min(p1, p2);
    if (winner - loser < 2) return "Winner must lead by at least 2 points.";
    if (loser <= 9 && winner !== 11) return "Winner must reach exactly 11 points if opponent has 9 or less.";
    if (loser >= 10 && winner - loser !== 2) return "In deuce (10-10+), winner must win by exactly 2 points.";
    return null;
}

function getMatchStatus(games: { p1: string; p2: string }[]): { p1Wins: number; p2Wins: number; isComplete: boolean; requiredWins: number } {
    let p1Wins = 0;
    let p2Wins = 0;

    for (const game of games) {
        if (game.p1 !== "" && game.p2 !== "") {
            const s1 = parseInt(game.p1);
            const s2 = parseInt(game.p2);
            if (!isNaN(s1) && !isNaN(s2) && !validateGameScore(s1, s2)) {
                if (s1 > s2) p1Wins++;
                else if (s2 > s1) p2Wins++;
            }
        }
    }

    const requiredWins = (games.length > 3 || Math.max(p1Wins, p2Wins) >= 3 || (p1Wins === 2 && p2Wins === 2)) ? 3 : 2;
    const isComplete = p1Wins >= requiredWins || p2Wins >= requiredWins;

    return { p1Wins, p2Wins, isComplete, requiredWins };
}


export default function EditMatchModal({ isOpen, onClose, match, users, currentUserId }: EditMatchModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [opponentId, setOpponentId] = useState("");
    const [games, setGames] = useState([{ p1: "", p2: "" }]);
    const [showRules, setShowRules] = useState(false);
    const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
    const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);

    useEffect(() => {
        if (match) {
            setOpponentId(match.player2Id === currentUserId ? match.player1Id : match.player2Id);
            setGames(match.games.map((g: any) => ({
                p1: g.scorePlayer1.toString(),
                p2: g.scorePlayer2.toString()
            })));
        }
    }, [match, currentUserId]);

    if (!isOpen || !match) return null;

    const isPending = match.status === 'PENDING';
    const isAccepted = match.status === 'ACCEPTED';
    const isValidated = match.status === 'VALIDATED';

    const addGame = () => {
        if (games.length < 5) setGames([...games, { p1: "", p2: "" }]);
    };

    const removeGame = (index: number) => {
        if (games.length > 1) setGames(games.filter((_, i) => i !== index));
    };

    const updateGame = (index: number, field: "p1" | "p2", value: string) => {
        const newGames = [...games];
        newGames[index][field] = value;
        setGames(newGames);

        // Validate
        const warnings: string[] = [];
        newGames.forEach((game, i) => {
            if (game.p1 !== "" && game.p2 !== "") {
                const s1 = parseInt(game.p1);
                const s2 = parseInt(game.p2);
                if (!isNaN(s1) && !isNaN(s2)) {
                    const err = validateGameScore(s1, s2);
                    if (err) warnings.push(`Game ${i + 1}: ${err}`);
                }
            }
        });
        setValidationWarnings(warnings);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, field: "p1" | "p2") => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (field === "p1") {
                document.getElementById(`edit-game-${index}-p2`)?.focus();
            } else if (field === "p2") {
                if (index < games.length - 1) {
                    document.getElementById(`edit-game-${index + 1}-p1`)?.focus();
                } else {
                    addGame();
                    setTimeout(() => document.getElementById(`edit-game-${index + 1}-p1`)?.focus(), 50);
                }
            }
        }
    };

    const onInputChange = (index: number, field: "p1" | "p2", value: string) => {
        updateGame(index, field, value);
        if (value.length >= 2) {
            if (field === "p1") {
                document.getElementById(`edit-game-${index}-p2`)?.focus();
            } else if (field === "p2" && index < games.length - 1) {
                document.getElementById(`edit-game-${index + 1}-p1`)?.focus();
            }
        }
    };

    const quickFill = (index: number, p1Score: number, p2Score: number) => {
        const newGames = [...games];
        newGames[index].p1 = p1Score.toString();
        newGames[index].p2 = p2Score.toString();
        setGames(newGames);

        if (index < games.length - 1) {
            document.getElementById(`edit-game-${index + 1}-p1`)?.focus();
        } else if (!getMatchStatus(newGames).isComplete) {
            setGames([...newGames, { p1: "", p2: "" }]);
            setTimeout(() => document.getElementById(`edit-game-${index + 1}-p1`)?.focus(), 50);
        }
    };


    const handleUpdate = async () => {
        if (!opponentId) return setError("Select an opponent");

        setLoading(true);
        setError("");

        try {
            // Basic validation
            const validGames = games.filter(g => g.p1 !== "" && g.p2 !== "");
            const formattedGames = validGames.map(g => ({
                scorePlayer1: parseInt(g.p1),
                scorePlayer2: parseInt(g.p2)
            }));

            const res = await fetch(`/api/matches/${match.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    opponentId,
                    games: formattedGames,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to update match");
            } else {
                router.refresh();
                onClose();
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/matches/${match.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to delete");
            } else {
                router.refresh();
                onClose();
            }
        } catch (err) {
            setError("Delete failed");
        } finally {
            setLoading(false);
        }
    };

    const opponents = users.filter(u => u.id !== currentUserId);

    return (
        <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Adjust Match" className="max-w-2xl">
            <div className="p-6 overflow-y-auto">

                {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}

                {isDeleteConfirm ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                            <h4 className="text-white font-bold mb-1">Are you sure?</h4>
                            <p className="text-sm text-slate-400">
                                {isValidated
                                    ? "This will request deletion from your opponent. ELO changes will be reverted upon approval."
                                    : "This will permanently delete this match record."}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteConfirm(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">Cancel</button>
                            <button onClick={handleDelete} disabled={loading} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center justify-center gap-2">
                                {loading && <Loader2 className="animate-spin" size={16} />} Delete Match
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {isValidated && (
                            <div className="p-3 bg-primary/10 border-primary/20 rounded-lg flex items-start gap-2">
                                <AlertTriangle size={16} className="text-primary mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-primary">
                                    Since this match is verified, any changes (including deletion) request approval from the opponent. ELO will be reverted and re-applied manually if needed by the system logic.
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Opponent</label>
                            <select
                                value={opponentId}
                                onChange={(e) => setOpponentId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                            >
                                {opponents.map((user) => (
                                    <option key={user.id} value={user.id}>{user.name || user.email}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4 mt-2">
                                <div className="space-y-1">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Game Scores</label>
                                    {isAccepted && (
                                        <p className="text-[11px] text-primary/80 font-medium">Enter game scores below to log the match result.</p>
                                    )}
                                </div>
                                <button
                                    onClick={addGame}
                                    disabled={games.length >= 5}
                                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <Plus size={14} /> Add Game
                                </button>
                            </div>
                            <div className="space-y-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                                {games.map((game, index) => (
                                    <div key={index} className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                                                <span className="text-[10px] font-black text-slate-500">#{index + 1}</span>
                                            </div>
                                            <div className="flex-1 flex items-center gap-2">
                                                <input
                                                    id={`edit-game-${index}-p1`}
                                                    type="number"
                                                    value={game.p1}
                                                    onChange={(e) => onInputChange(index, "p1", e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, index, "p1")}
                                                    className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-center font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                                                    placeholder="You"
                                                />
                                                <div className="w-4 h-[2px] bg-slate-800" />
                                                <input
                                                    id={`edit-game-${index}-p2`}
                                                    type="number"
                                                    value={game.p2}
                                                    onChange={(e) => onInputChange(index, "p2", e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, index, "p2")}
                                                    className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-center font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                                                    placeholder="Opp"
                                                />
                                            </div>
                                            {games.length > 1 && (
                                                <button
                                                    onClick={() => removeGame(index)}
                                                    className="p-2.5 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-400 transition-all active:scale-90"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex pl-11 gap-2 opacity-50 focus-within:opacity-100 hover:opacity-100 transition-opacity">
                                            <button onClick={() => quickFill(index, 11, 0)} className="px-2 py-0.5 text-[9px] font-bold tracking-wider rounded border border-slate-700 hover:border-primary text-slate-400">11-0</button>
                                            <button onClick={() => quickFill(index, 11, 5)} className="px-2 py-0.5 text-[9px] font-bold tracking-wider rounded border border-slate-700 hover:border-primary text-slate-400">11-5</button>
                                            <button onClick={() => quickFill(index, 0, 11)} className="px-2 py-0.5 text-[9px] font-bold tracking-wider rounded border border-slate-700 hover:border-red-400 text-slate-400">0-11</button>
                                            <button onClick={() => quickFill(index, 5, 11)} className="px-2 py-0.5 text-[9px] font-bold tracking-wider rounded border border-slate-700 hover:border-red-400 text-slate-400">5-11</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>


                        {validationWarnings.length > 0 && (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                                {validationWarnings.map((w, i) => <p key={i}>{w}</p>)}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsDeleteConfirm(true)}
                                type="button"
                                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-red-400 font-semibold rounded-lg transition-colors border border-slate-700"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={loading}
                                className="flex-1 py-3 btn-primary text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {loading && <Loader2 className="animate-spin" size={18} />}
                                {isValidated ? "Request Changes" : "Save Changes"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
        </ResponsiveModal>
    );
}
