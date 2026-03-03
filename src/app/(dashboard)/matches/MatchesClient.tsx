"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, CheckCircle2, X, Loader2, Edit3, AlertCircle, User, Swords, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import LogResultModal from "@/components/LogResultModal";
import EditMatchModal from "@/components/EditMatchModal";

interface MatchesClientProps {
    matches: any[];
    users: { id: string; name: string | null; email: string }[];
    currentUserId: string;
}

export default function MatchesClient({ matches, users, currentUserId }: MatchesClientProps) {
    const router = useRouter();
    const [showLogModal, setShowLogModal] = useState(false);
    const [editingMatch, setEditingMatch] = useState<any>(null);
    const [validating, setValidating] = useState<string | null>(null);

    const handleValidate = async (matchId: string, action: "confirm" | "reject" | "approve_adjustment" | "reject_adjustment") => {
        setValidating(matchId);
        try {
            const res = await fetch(`/api/matches/${matchId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error("Validation failed:", error);
        } finally {
            setValidating(null);
        }
    };

    const groupedMatches = useMemo(() => {
        const groups: { label: string; matches: any[] }[] = [];
        const now = new Date();
        const todayAt = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterdayAt = todayAt - 86400000;

        matches.forEach(match => {
            const d = new Date(match.playedAt);
            const dAt = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

            let label = "";
            if (dAt === todayAt) label = "Today";
            else if (dAt === yesterdayAt) label = "Yesterday";
            else label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });

            const existingGroup = groups.find(g => g.label === label);
            if (existingGroup) {
                existingGroup.matches.push(match);
            } else {
                groups.push({ label, matches: [match] });
            }
        });
        return groups;
    }, [matches]);

    return (
        <>
            <div className="space-y-10 max-w-5xl mx-auto pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                                <Swords size={24} />
                            </div>
                            <h2 className="text-4xl font-extrabold text-white tracking-tight">Match History</h2>
                        </div>
                        <p className="text-slate-400 text-lg ml-1">Track history and validate pending results.</p>
                    </div>
                    <button
                        onClick={() => setShowLogModal(true)}
                        className="btn-primary text-white px-6 py-3 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] w-full md:w-auto"
                    >
                        <Plus size={20} />
                        Log Result
                    </button>
                </div>

                {/* Match Groups */}
                <div className="space-y-12">
                    {matches.length === 0 ? (
                        <div className="text-center py-24 px-6 rounded-[2rem] border-2 border-dashed border-slate-800 bg-slate-900/40 backdrop-blur-sm">
                            <div className="w-24 h-24 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-500 ring-4 ring-slate-900">
                                <Swords size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">No matches captured yet</h3>
                            <p className="text-slate-400 max-w-sm mx-auto mb-8 text-lg">
                                Ready for a challenge? Start tracking your pro matches and climb the rankings!
                            </p>
                            <button
                                onClick={() => setShowLogModal(true)}
                                className="btn-primary px-8 py-4 rounded-2xl text-white font-bold inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-primary/25"
                            >
                                <Plus size={22} /> Log First Match
                            </button>
                        </div>
                    ) : (
                        groupedMatches.map((group) => (
                            <div key={group.label} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                        <Calendar size={14} className="text-primary/60" />
                                        {group.label}
                                    </h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
                                </div>
                                <div className="grid gap-4">
                                    {group.matches.map((match) => (
                                        <MatchCard
                                            key={match.id}
                                            match={match}
                                            currentUserId={currentUserId}
                                            onValidate={handleValidate}
                                            validating={validating === match.id}
                                            onEdit={() => setEditingMatch(match)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <LogResultModal
                isOpen={showLogModal}
                onClose={() => setShowLogModal(false)}
                users={users}
                currentUserId={currentUserId}
            />

            <EditMatchModal
                isOpen={!!editingMatch}
                onClose={() => setEditingMatch(null)}
                match={editingMatch}
                users={users}
                currentUserId={currentUserId}
            />
        </>
    );
}

function MatchCard({
    match,
    currentUserId,
    onValidate,
    validating,
    onEdit,
}: {
    match: any;
    currentUserId: string;
    onValidate: (id: string, action: "confirm" | "reject" | "approve_adjustment" | "reject_adjustment") => void;
    validating: boolean;
    onEdit: () => void;
}) {
    const isPending = match.status === "PENDING";
    const isAccepted = match.status === "ACCEPTED";
    const isValidated = match.status === "VALIDATED";
    const isFriendly = match.isValidated === false && isValidated;
    const isRejected = match.status === "REJECTED";

    const canValidate = isPending && match.player2Id === currentUserId && match.games?.length > 0;
    const canAcceptChallenge = isPending && match.player2Id === currentUserId && match.games?.length === 0;

    const hasAdjustment = !!match.adjustmentRequest;
    const canApproveAdjustment = isValidated && hasAdjustment && (match.player1Id === currentUserId || match.player2Id === currentUserId);
    const requestedBy = match.adjustmentRequest?.requestedBy;
    const isRequester = requestedBy === currentUserId;
    const showAdjustmentApproval = canApproveAdjustment && !isRequester;

    const canEdit = isAccepted || (isPending && match.player1Id === currentUserId) || (isValidated && (match.player1Id === currentUserId || match.player2Id === currentUserId));

    const p1Winner = match.winnerId === match.player1Id;
    const p2Winner = match.winnerId === match.player2Id;

    return (
        <div className={cn(
            "glass-card glass-card-hover group relative rounded-3xl overflow-hidden",
            isPending && "ring-1 ring-amber-500/20",
            isAccepted && "ring-1 ring-primary/30 bg-primary/5"
        )}>
            {/* Left Status Bar */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5 transition-colors",
                isRejected ? "bg-red-500" :
                    isPending ? "bg-amber-500" :
                        isAccepted ? "bg-primary" :
                            isFriendly ? "bg-amber-400" :
                                "bg-emerald-500"
            )} />

            <div className="flex flex-col p-4 md:p-6 gap-6">
                {/* Main Row: Players & Score */}
                <div className="flex items-center justify-between gap-4 md:gap-8">

                    {/* Player 1 - Mobile Compact, Desktop Full */}
                    <div className={cn(
                        "flex items-center gap-3 md:gap-5 flex-1 min-w-0",
                        p1Winner && "winner"
                    )}>
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl gradient-primary flex items-center justify-center text-white text-lg md:text-2xl font-black overflow-hidden avatar-ring border-2 border-white/10 shadow-lg">
                                {match.player1?.avatarUrl ? (
                                    <img src={match.player1.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    match.player1?.name?.charAt(0)?.toUpperCase() || <User />
                                )}
                            </div>
                            {p1Winner && !isPending && !isRejected && (
                                <div className="absolute -top-2 -left-2 bg-emerald-500 text-white p-1 rounded-lg shadow-lg border border-white/20">
                                    <CheckCircle2 size={12} fill="currentColor" fillOpacity={0.2} />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <Link href={`/profile/${match.player1Id}`} className={cn(
                                "text-sm md:text-lg font-bold truncate transition-colors hover:text-primary",
                                p1Winner ? "text-white" : "text-slate-400"
                            )}>
                                {match.player1?.name || "Player 1"}
                                {match.player1Id === currentUserId && <span className="text-primary text-[10px] md:text-xs ml-1.5 font-black uppercase opacity-80">(You)</span>}
                            </Link>
                            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">Player 1</span>
                        </div>
                    </div>

                    {/* Scores Section */}
                    <div className="flex flex-col items-center gap-2 shrink-0 px-1 md:px-0">
                        <div className="flex items-center gap-1.5 md:gap-3">
                            {match.games?.length > 0 ? (
                                match.games.map((g: any, i: number) => (
                                    <div key={i} className="score-box group shrink-0 scale-90 md:scale-100">
                                        <span className={cn(g.scorePlayer1 > g.scorePlayer2 ? "text-white" : "text-slate-500")}>
                                            {g.scorePlayer1}
                                        </span>
                                        <div className="h-[1px] w-4 bg-slate-800 my-1" />
                                        <span className={cn(g.scorePlayer2 > g.scorePlayer1 ? "text-white" : "text-slate-500")}>
                                            {g.scorePlayer2}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="h-10 md:h-14 flex items-center text-slate-700 font-black italic tracking-tighter text-base md:text-xl">VS</div>
                            )}
                        </div>
                    </div>

                    {/* Player 2 - Mobile Compact, Desktop Full */}
                    <div className={cn(
                        "flex items-center gap-3 md:gap-5 flex-1 min-w-0 justify-end text-right",
                        p2Winner && "winner"
                    )}>
                        <div className="flex flex-col min-w-0">
                            <Link href={`/profile/${match.player2Id}`} className={cn(
                                "text-sm md:text-lg font-bold truncate transition-colors hover:text-primary",
                                p2Winner ? "text-white" : "text-slate-400"
                            )}>
                                {match.player2Id === currentUserId && <span className="text-primary text-[10px] md:text-xs mr-1.5 font-black uppercase opacity-80">(You)</span>}
                                {match.player2?.name || "Player 2"}
                            </Link>
                            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">Player 2</span>
                        </div>
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl gradient-primary flex items-center justify-center text-white text-lg md:text-2xl font-black overflow-hidden avatar-ring border-2 border-white/10 shadow-lg">
                                {match.player2?.avatarUrl ? (
                                    <img src={match.player2.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    match.player2?.name?.charAt(0)?.toUpperCase() || <User />
                                )}
                            </div>
                            {p2Winner && !isPending && !isRejected && (
                                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-lg shadow-lg border border-white/20">
                                    <CheckCircle2 size={12} fill="currentColor" fillOpacity={0.2} />
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer Section: Metadata & Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
                    <div className="flex items-center gap-4 text-[10px] md:text-xs font-bold font-mono tracking-tight">
                        <div className="flex items-center gap-1.5 text-slate-500">
                            <Clock size={12} />
                            {new Date(match.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        {/* Status Badge */}
                        {isRejected ? (
                            <span className="status-badge status-rejected flex items-center gap-1">
                                <X size={10} /> Rejected
                            </span>
                        ) : isPending ? (
                            <span className="status-badge status-pending flex items-center gap-1">
                                <Clock size={10} /> {match.games?.length === 0 ? "Challenged" : "Pending"}
                            </span>
                        ) : isAccepted ? (
                            <span className="status-badge bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                                <Swords size={10} /> Ready to Play
                            </span>
                        ) : isFriendly ? (
                            <span className="status-badge bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1">
                                🎯 Friendly
                            </span>
                        ) : (
                            <span className="status-badge status-verified flex items-center gap-1">
                                <CheckCircle2 size={10} /> Verified
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Adjustment/Validation Logic */}
                        {showAdjustmentApproval && (
                            <div className="flex items-center gap-2 bg-amber-500/10 p-1.5 rounded-xl border border-amber-500/20">
                                <span className="text-[10px] font-black text-amber-500 uppercase px-2 hidden md:inline">Adjust?</span>
                                {validating ? (
                                    <Loader2 className="animate-spin text-slate-400 mx-2" size={16} />
                                ) : (
                                    <div className="flex gap-1">
                                        <button onClick={() => onValidate(match.id, "approve_adjustment")} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-all">
                                            <CheckCircle2 size={14} />
                                        </button>
                                        <button onClick={() => onValidate(match.id, "reject_adjustment")} className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-sm transition-all">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {isRequester && hasAdjustment && (
                            <span className="text-[10px] font-black text-slate-500 uppercase italic flex items-center gap-1.5 mr-2">
                                <Loader2 size={10} className="animate-spin" /> Adjustment Pending
                            </span>
                        )}

                        {canValidate ? (
                            <div className="flex items-center gap-2">
                                {validating ? (
                                    <Loader2 className="animate-spin text-slate-400" size={18} />
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onValidate(match.id, "confirm")}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-widest"
                                        >
                                            Verify
                                        </button>
                                        <button
                                            onClick={() => onValidate(match.id, "reject")}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black rounded-xl shadow-lg shadow-red-500/20 transition-all uppercase tracking-widest"
                                        >
                                            Deny
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {canAcceptChallenge ? (
                            <div className="flex items-center gap-2">
                                {validating ? (
                                    <Loader2 className="animate-spin text-slate-400" size={18} />
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onValidate(match.id, "accept_challenge" as any)}
                                            className="px-4 py-2 bg-primary hover:bg-indigo-500 text-white text-[10px] font-black rounded-xl shadow-lg shadow-primary/20 transition-all uppercase tracking-widest"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => onValidate(match.id, "reject")}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black rounded-xl shadow-lg shadow-red-500/20 transition-all uppercase tracking-widest"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {/* Edit/Log Button */}
                        {canEdit && !hasAdjustment && (
                            <button
                                onClick={onEdit}
                                className={cn(
                                    "px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2",
                                    isAccepted
                                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                        : "text-slate-500 hover:text-white hover:bg-white/10"
                                )}
                                title={isAccepted ? "Log Result" : "Adjust Match"}
                            >
                                {isAccepted ? (
                                    <>
                                        <Plus size={14} /> Log Result
                                    </>
                                ) : (
                                    <Edit3 size={16} />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


