"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import RulesModal from "./RulesModal";
import ResponsiveModal from "@/components/ui/ResponsiveModal";

interface LogResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: { id: string; name: string | null; email: string }[];
    currentUserId: string;
}

// Validate a single game score according to ping pong rules
function validateGameScore(p1: number, p2: number): string | null {
    const winner = Math.max(p1, p2);
    const loser = Math.min(p1, p2);

    // Game must be won by at least 2 points
    if (winner - loser < 2) {
        return "Winner must lead by at least 2 points.";
    }

    // Standard win: 11 points with opponent at 9 or less
    if (loser <= 9 && winner !== 11) {
        return "Winner must reach exactly 11 points if opponent has 9 or less.";
    }

    // Deuce win: if both reached 10+, winner can be higher but must win by 2
    if (loser >= 10 && winner - loser !== 2) {
        return "In deuce (10-10+), winner must win by exactly 2 points.";
    }

    return null;
}

// Check if match is already complete (best of 3)
function getMatchStatus(games: { p1: string; p2: string }[]): { p1Wins: number; p2Wins: number; isComplete: boolean } {
    let p1Wins = 0;
    let p2Wins = 0;

    for (const game of games) {
        if (game.p1 !== "" && game.p2 !== "") {
            const s1 = parseInt(game.p1);
            const s2 = parseInt(game.p2);
            if (!isNaN(s1) && !isNaN(s2)) {
                if (s1 > s2) p1Wins++;
                else if (s2 > s1) p2Wins++;
            }
        }
    }

    const isComplete = p1Wins >= 2 || p2Wins >= 2;
    return { p1Wins, p2Wins, isComplete };
}

export default function LogResultModal({ isOpen, onClose, users, currentUserId }: LogResultModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [opponentId, setOpponentId] = useState("");
    const [games, setGames] = useState([{ p1: "", p2: "" }]);
    const [skipValidation, setSkipValidation] = useState(false);
    const [isFriendlyMatch, setIsFriendlyMatch] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

    if (!isOpen) return null;

    const addGame = () => {
        const status = getMatchStatus(games);
        if (status.isComplete) {
            setValidationWarnings(["Match is already decided. A third game is not possible."]);
            return;
        }
        if (games.length < 5) {
            setGames([...games, { p1: "", p2: "" }]);
            setValidationWarnings([]);
        }
    };

    const removeGame = (index: number) => {
        if (games.length > 1) {
            setGames(games.filter((_, i) => i !== index));
            setValidationWarnings([]);
        }
    };

    const updateGame = (index: number, field: "p1" | "p2", value: string) => {
        const newGames = [...games];
        newGames[index][field] = value;
        setGames(newGames);

        // Validate on change
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

        // Final validation check
        for (let i = 0; i < validGames.length; i++) {
            const s1 = parseInt(validGames[i].p1);
            const s2 = parseInt(validGames[i].p2);
            const err = validateGameScore(s1, s2);
            if (err) {
                setError(`Game ${i + 1}: ${err}`);
                return;
            }
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/matches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    opponentId,
                    games: validGames.map(g => ({
                        p1: parseInt(g.p1),
                        p2: parseInt(g.p2),
                    })),
                    skipValidation,
                    isFriendlyMatch,
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
        <>
            <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Log Match Result">
                <div className="p-6 space-y-6">

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
                                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
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
                                    className="text-xs text-primary hover:text-primary flex items-center gap-1 disabled:opacity-50"
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
                                            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <span className="text-slate-500">-</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="99"
                                            value={game.p2}
                                            onChange={(e) => updateGame(index, "p2", e.target.value)}
                                            placeholder="Opp"
                                            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-primary"
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

                        {/* Validation Warnings */}
                        {validationWarnings.length > 0 && (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        {validationWarnings.map((w, i) => (
                                            <p key={i} className="text-amber-400 text-sm">{w}</p>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setShowRules(true)}
                                            className="text-xs text-primary hover:text-primary underline mt-2"
                                        >
                                            View Official Rules
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-slate-500">
                            {skipValidation
                                ? "Match will be validated immediately and ELO updated."
                                : "Your opponent will need to verify this result before ELO is updated."
                            }
                        </p>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="skipValidation"
                                checked={skipValidation}
                                onChange={(e) => setSkipValidation(e.target.checked)}
                                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="skipValidation" className="text-sm text-slate-400 select-none cursor-pointer">
                                Skip validation (auto-confirm)
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="friendlyMatch"
                                checked={isFriendlyMatch}
                                onChange={(e) => setIsFriendlyMatch(e.target.checked)}
                                className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                            />
                            <label htmlFor="friendlyMatch" className="text-sm text-slate-400 select-none cursor-pointer">
                                🎯 Friendly match (no ELO impact)
                            </label>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full py-3 rounded-lg btn-primary text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                            {isFriendlyMatch ? "Log Friendly Match" : "Submit Match"}
                        </button>
                    </div>
                </div>
            </ResponsiveModal>

            <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
        </>
    );
}
