"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, User, ChevronRight, Loader2, Shield, RefreshCw, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Player {
    id: string;
    name: string | null;
    avatarUrl?: string | null;
    elo?: number;
}

interface BracketMatch {
    id: string;
    round: number;
    position: number;
    player1: Player | null;
    player2: Player | null;
    winner: Player | null;
    score1: number | null;
    score2: number | null;
    status: string;
}

interface TournamentBracketProps {
    tournamentId: string;
    bracketMatches: BracketMatch[];
    currentUserId: string;
    isAdmin: boolean;
    bracketGenerated: boolean;
    onRefresh: () => void;
}

export default function TournamentBracket({
    tournamentId,
    bracketMatches,
    currentUserId,
    isAdmin,
    bracketGenerated,
    onRefresh,
}: TournamentBracketProps) {
    const [generating, setGenerating] = useState(false);
    const [seedingType, setSeedingType] = useState<"RANDOM" | "ELO">("RANDOM");
    const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);

    // Group matches by round
    const rounds: { [key: number]: BracketMatch[] } = {};
    let maxRound = 0;
    bracketMatches.forEach((match) => {
        if (!rounds[match.round]) rounds[match.round] = [];
        rounds[match.round].push(match);
        if (match.round > maxRound) maxRound = match.round;
    });

    const roundNames = (round: number, total: number): string => {
        if (round === total) return "Finals";
        if (round === total - 1) return "Semi-Finals";
        if (round === total - 2) return "Quarter-Finals";
        return `Round ${round}`;
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch(`/api/tournaments/${tournamentId}/bracket`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seedingType }),
            });
            const data = await res.json();
            if (res.ok) {
                onRefresh();
            } else {
                alert(data.error || "Failed to generate bracket");
            }
        } catch (error) {
            console.error("Failed to generate bracket:", error);
            alert("Failed to generate bracket. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    if (!bracketGenerated) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                    <Trophy size={40} className="text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Bracket Not Generated</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                    The tournament bracket hasn't been created yet.
                    {isAdmin && " Select a seeding method and generate the bracket."}
                </p>

                {isAdmin && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSeedingType("RANDOM")}
                                className={cn(
                                    "px-4 py-2 rounded-lg font-medium transition-all",
                                    seedingType === "RANDOM"
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                )}
                            >
                                <RefreshCw size={16} className="inline mr-2" />
                                Random
                            </button>
                            <button
                                onClick={() => setSeedingType("ELO")}
                                className={cn(
                                    "px-4 py-2 rounded-lg font-medium transition-all",
                                    seedingType === "ELO"
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                )}
                            >
                                <Trophy size={16} className="inline mr-2" />
                                ELO Seeding
                            </button>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {generating && <Loader2 className="animate-spin" size={18} />}
                            Generate Bracket
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max p-4">
                {Array.from({ length: maxRound }, (_, i) => i + 1).map((round) => (
                    <div key={round} className="flex flex-col gap-4">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider text-center mb-2">
                            {roundNames(round, maxRound)}
                        </h4>

                        <div
                            className="flex flex-col justify-around"
                            style={{ minHeight: `${(rounds[1]?.length || 1) * 100}px` }}
                        >
                            {(rounds[round] || []).map((match) => (
                                <MatchCard
                                    key={match.id}
                                    match={match}
                                    isAdmin={isAdmin}
                                    currentUserId={currentUserId}
                                    tournamentId={tournamentId}
                                    onRefresh={onRefresh}
                                    round={round}
                                    maxRound={maxRound}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MatchCard({
    match,
    isAdmin,
    currentUserId,
    tournamentId,
    onRefresh,
    round,
    maxRound,
}: {
    match: BracketMatch;
    isAdmin: boolean;
    currentUserId: string;
    tournamentId: string;
    onRefresh: () => void;
    round: number;
    maxRound: number;
}) {
    const [showActions, setShowActions] = useState(false);
    const isParticipant = match.player1?.id === currentUserId || match.player2?.id === currentUserId;
    const isFinal = round === maxRound;

    return (
        <div
            className={cn(
                "relative w-64 bg-slate-900/80 border rounded-xl overflow-hidden transition-all",
                match.status === "PLAYED"
                    ? "border-emerald-500/30"
                    : match.status === "BYE"
                        ? "border-amber-500/30"
                        : "border-slate-700/50",
                isFinal && "ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10"
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Match Header */}
            {isFinal && (
                <div className="bg-gradient-to-r from-amber-600/20 to-amber-500/10 px-3 py-1 text-center">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">🏆 Finals</span>
                </div>
            )}

            {/* Player Slots */}
            <div className="divide-y divide-slate-800/50">
                <PlayerSlot
                    player={match.player1}
                    score={match.score1}
                    isWinner={match.winner?.id === match.player1?.id}
                    status={match.status}
                />
                <PlayerSlot
                    player={match.player2}
                    score={match.score2}
                    isWinner={match.winner?.id === match.player2?.id}
                    status={match.status}
                />
            </div>

            {/* Status Badge */}
            <div className="px-3 py-2 bg-slate-950/50 flex items-center justify-between">
                <span
                    className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        match.status === "PLAYED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : match.status === "BYE"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-slate-700/50 text-slate-400"
                    )}
                >
                    {match.status}
                </span>

                {isAdmin && showActions && match.player1 && match.player2 && (
                    <button
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Dispatch event or use simple prop callback if we could lift state
                            // For simplicity, we are passing a setter from parent, or we can use a custom event.
                            // Better: Pass setManagingMatch from parent to MatchCard
                            const event = new CustomEvent("manageMatch", { detail: match });
                            window.dispatchEvent(event);
                        }}
                    >
                        <Settings size={14} />
                        Manage
                    </button>
                )}
            </div>
        </div>
    );
}

function PlayerSlot({
    player,
    score,
    isWinner,
    status,
}: {
    player: Player | null;
    score: number | null;
    isWinner: boolean;
    status: string;
}) {
    return (
        <div
            className={cn(
                "flex items-center justify-between px-3 py-3 transition-colors",
                isWinner && status === "PLAYED" && "bg-emerald-500/10"
            )}
        >
            <div className="flex items-center gap-2 min-w-0">
                {player ? (
                    <>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                            {player.avatarUrl ? (
                                <img src={player.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                player.name?.charAt(0)?.toUpperCase() || "?"
                            )}
                        </div>
                        <div className="min-w-0">
                            <Link href={`/profile/${player.id}`} className={cn("text-sm font-medium truncate hover:underline", isWinner ? "text-emerald-400" : "text-white")}>
                                {player.name || "TBD"}
                            </Link>
                            {player.elo && <p className="text-xs text-slate-500">{player.elo} ELO</p>}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2 text-slate-500">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                            <User size={14} />
                        </div>
                        <span className="text-sm italic">TBD</span>
                    </div>
                )}
            </div>

            {score !== null && (
                <span
                    className={cn(
                        "text-lg font-bold tabular-nums",
                        isWinner ? "text-emerald-400" : "text-slate-400"
                    )}
                >
                    {score}
                </span>
            )}

            {isWinner && status === "PLAYED" && (
                <ChevronRight size={16} className="text-emerald-400 ml-1" />
            )}
        </div>
    );
}

function ManageMatchModal({
    match,
    isOpen,
    onClose,
    onUpdate,
    tournamentId
}: {
    match: BracketMatch | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
    tournamentId: string;
}) {
    const [score1, setScore1] = useState(match?.score1?.toString() || "");
    const [score2, setScore2] = useState(match?.score2?.toString() || "");
    const [loading, setLoading] = useState(false);

    if (!isOpen || !match) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            const s1 = parseInt(score1);
            const s2 = parseInt(score2);

            if (isNaN(s1) || isNaN(s2)) {
                alert("Please enter valid scores");
                return;
            }

            const winnerId = s1 > s2 ? match.player1?.id : match.player2?.id;

            await fetch(`/api/tournaments/${tournamentId}/bracket/${match.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "setWinner",
                    score1: s1,
                    score2: s2,
                    winnerId
                }),
            });
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to update match");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!confirm("Are you sure? This will remove the winner and clear scores.")) return;
        setLoading(true);
        try {
            await fetch(`/api/tournaments/${tournamentId}/bracket/${match.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "reset" }),
            });
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to reset match");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Manage Match</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="text-center space-y-2">
                        <div className="font-bold text-indigo-400 truncate">{match.player1?.name}</div>
                        <input
                            type="number"
                            value={score1}
                            onChange={(e) => setScore1(e.target.value)}
                            className="w-20 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-center font-mono text-xl focus:border-indigo-500 focus:outline-none"
                        />
                    </div>
                    <div className="text-center text-slate-500 font-bold text-xl">VS</div>
                    <div className="text-center space-y-2">
                        <div className="font-bold text-purple-400 truncate">{match.player2?.name}</div>
                        <input
                            type="number"
                            value={score2}
                            onChange={(e) => setScore2(e.target.value)}
                            className="w-20 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-center font-mono text-xl focus:border-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800">
                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 border border-transparent transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} /> Reset Match
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <><Shield size={18} /> Update Result</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
