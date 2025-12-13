"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Game, Match, User } from "@prisma/client";

type MatchWithRelations = Match & {
    player1: User;
    player2: User;
    winner: User | null;
    games: Game[];
};

interface MatchItemProps {
    match: MatchWithRelations;
    currentUserId: string;
}

export function MatchItem({ match, currentUserId }: MatchItemProps) {
    const isWinner = match.winnerId === currentUserId;

    return (
        <div className="group relative overflow-hidden bg-slate-900/40 border border-slate-800 rounded-2xl p-4 transition-all hover:bg-slate-800/60 hover:border-slate-700">
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                    {/* Date Badge */}
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-400 font-medium text-xs">
                        <span className="text-lg text-white font-bold">{new Date(match.playedAt).getDate()}</span>
                        <span>{new Date(match.playedAt).toLocaleString('default', { month: 'short' })}</span>
                    </div>

                    {/* Players */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <Link href={`/profile/${match.player1.id}`} className={cn("text-base font-semibold hover:underline hover:text-indigo-400 transition-colors", match.winnerId === match.player1Id ? "text-white" : "text-slate-400")}>
                                {match.player1.name}
                            </Link>
                            <span className="text-xs text-slate-600 font-medium">vs</span>
                            <Link href={`/profile/${match.player2.id}`} className={cn("text-base font-semibold hover:underline hover:text-indigo-400 transition-colors", match.winnerId === match.player2Id ? "text-white" : "text-slate-400")}>
                                {match.player2.name}
                            </Link>
                        </div>
                        <div className="text-xs text-slate-500 font-mono flex gap-2">
                            {match.games.map((g, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800/50 border border-slate-700/30">{g.scorePlayer1}-{g.scorePlayer2}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {match.status === 'VALIDATED' ? (
                        <div className={cn("px-3 py-1 rounded-full text-xs font-bold border", isWinner ? "bg-green-500/10 text-green-400 border-green-500/20" : (match.winnerId ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-800 text-slate-400 border-slate-700"))}>
                            {isWinner ? "VICTORY" : (match.winnerId ? "DEFEAT" : "DRAW")}
                        </div>
                    ) : (
                        <div className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            PENDING
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
