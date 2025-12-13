"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, CheckCircle2, X, Loader2, Edit3, AlertCircle, User } from "lucide-react";
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

    return (
        <>
            <div className="space-y-8 max-w-5xl mx-auto">
                {/* Header & Actions */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Matches</h2>
                        <p className="text-slate-400 mt-1">Track history and validate pending results.</p>
                    </div>
                    <button
                        onClick={() => setShowLogModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-sm font-semibold transition-all hover:scale-105"
                    >
                        <Plus size={18} />
                        Log Result
                    </button>
                </div>

                {/* Match Grid */}
                <div className="space-y-4">
                    {matches.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            No matches found. Log your first match!
                        </div>
                    ) : (
                        matches.map((match) => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                currentUserId={currentUserId}
                                onValidate={handleValidate}
                                validating={validating === match.id}
                                onEdit={() => setEditingMatch(match)}
                            />
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
    const isValidated = match.status === "VALIDATED";

    // Validation: P2 can validate PENDING matches
    const canValidate = isPending && match.player2Id === currentUserId;

    // Adjustment: Opponent can approve requested adjustment
    // (Opponent is the one who didn't request)
    // Actually we don't know who requested in MVP schema (json blob).
    // Assuming currentUser is participant and button shows up if currentUser didn't initiate?
    // Let's simpler: Show for both, but backend blocks requester.
    // Or just show for "Other player".

    const hasAdjustment = !!match.adjustmentRequest;
    const canApproveAdjustment = isValidated && hasAdjustment && (match.player1Id === currentUserId || match.player2Id === currentUserId);
    // Ideally we filter out requester.
    // Let's assume the user who requested sees "Pending Approval" and the other sees "Approve".
    // We can rely on `requestedBy` field inside JSON if we added it (we did in updated PUT!).
    const requestedBy = match.adjustmentRequest?.requestedBy;
    const isRequester = requestedBy === currentUserId;
    const showAdjustmentApproval = canApproveAdjustment && !isRequester;

    const canEdit = (isPending && match.player1Id === currentUserId) || (isValidated && (match.player1Id === currentUserId || match.player2Id === currentUserId));

    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-2xl border p-5 transition-all",
                isPending
                    ? "bg-slate-900/80 border-amber-900/30 hover:border-amber-500/30"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
            )}
        >
            {/* Status Indicator Stripe */}
            <div
                className={cn(
                    "absolute left-0 top-0 bottom-0 w-1",
                    match.status === "REJECTED" ? "bg-red-500" : isPending ? "bg-amber-500" : "bg-emerald-500"
                )}
            />

            <div className="flex flex-col md:flex-row items-center gap-6 pl-3">
                {/* Date */}
                <div className="hidden md:flex flex-col items-center justify-center min-w-[70px] py-1">
                    <span className="text-2xl font-bold text-slate-200">
                        {new Date(match.playedAt).getDate()}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase">
                        {new Date(match.playedAt).toLocaleString("default", { month: "short" })}
                    </span>
                </div>

                {/* Match Content */}
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Players & Score */}
                    <div className="md:col-span-2 flex items-center justify-between md:justify-start gap-8">
                        {/* Player 1 */}
                        <div
                            className={cn(
                                "flex items-center justify-end gap-3 flex-1 md:flex-none md:w-40 transition-colors",
                                match.winnerId === match.player1Id
                                    ? "text-white font-bold"
                                    : "text-slate-400 font-medium"
                            )}
                        >
                            <div className="flex flex-col items-end">
                                <Link href={`/profile/${match.player1Id}`} className="hover:text-indigo-400 hover:underline transition-colors flex items-center gap-2">
                                    {match.player1?.name?.split(" ")[0] || "Player 1"}
                                    {match.player1Id === currentUserId && (
                                        <span className="text-indigo-400 text-xs">(you)</span>
                                    )}
                                </Link>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0 border border-slate-700">
                                {match.player1?.avatarUrl ? (
                                    <img src={match.player1.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    match.player1?.name?.charAt(0)?.toUpperCase() || <User size={14} />
                                )}
                            </div>
                        </div>

                        {/* Middle Score */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1">
                                {match.games?.map((g: any, i: number) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex flex-col items-center justify-center w-8 h-10 rounded bg-slate-950 border text-xs font-mono",
                                            isPending
                                                ? "border-slate-800 text-slate-500"
                                                : "border-slate-700 text-slate-300"
                                        )}
                                    >
                                        <span>{g.scorePlayer1}</span>
                                        <div className="h-[1px] w-4 bg-slate-800" />
                                        <span>{g.scorePlayer2}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Player 2 */}
                        <div
                            className={cn(
                                "flex items-center justify-start gap-3 flex-1 md:flex-none md:w-40 transition-colors",
                                match.winnerId === match.player2Id
                                    ? "text-white font-bold"
                                    : "text-slate-400 font-medium"
                            )}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0 border border-slate-700">
                                {match.player2?.avatarUrl ? (
                                    <img src={match.player2.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    match.player2?.name?.charAt(0)?.toUpperCase() || <User size={14} />
                                )}
                            </div>
                            <div className="flex flex-col items-start">
                                <Link href={`/profile/${match.player2Id}`} className="hover:text-indigo-400 hover:underline transition-colors flex items-center gap-2">
                                    {match.player2?.name?.split(" ")[0] || "Player 2"}
                                    {match.player2Id === currentUserId && (
                                        <span className="text-indigo-400 text-xs">(you)</span>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Meta & Status */}
                    <div className="flex items-center justify-between md:justify-end gap-4 w-full border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                        <div className="md:hidden text-xs text-slate-500">
                            {new Date(match.playedAt).toLocaleDateString()}
                        </div>

                        {/* Adjustment Approval UI */}
                        {showAdjustmentApproval && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-500 flex items-center gap-1 animate-pulse">
                                    <AlertCircle size={12} /> Adjustment Requested
                                </span>
                                {validating ? (
                                    <Loader2 className="animate-spin text-slate-400" size={18} />
                                ) : (
                                    <>
                                        <button onClick={() => onValidate(match.id, "approve_adjustment")} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow-lg transition-all" title="Approve Changes">
                                            <CheckCircle2 size={16} />
                                        </button>
                                        <button onClick={() => onValidate(match.id, "reject_adjustment")} className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded shadow-lg transition-all" title="Reject Changes">
                                            <X size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Rejection/Pending Request Status for Requester */}
                        {isRequester && hasAdjustment && (
                            <span className="text-xs font-bold text-slate-500 italic flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin" /> Adjustment Pending Approval
                            </span>
                        )}

                        {canValidate ? (
                            <div className="flex items-center gap-2">
                                {validating ? (
                                    <Loader2 className="animate-spin text-slate-400" size={18} />
                                ) : (
                                    <>
                                        <span className="text-xs font-bold text-amber-500 animate-pulse">
                                            VALIDATE
                                        </span>
                                        <button
                                            onClick={() => onValidate(match.id, "confirm")}
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
                                        >
                                            CONFIRM
                                        </button>
                                        <button
                                            onClick={() => onValidate(match.id, "reject")}
                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-500/20 transition-all"
                                        >
                                            REJECT
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : !showAdjustmentApproval && !hasAdjustment && (
                            match.status === "PENDING" ? (
                                <div className="flex items-center gap-2 text-amber-500/80">
                                    <span className="text-xs font-bold">PENDING</span>
                                </div>
                            ) : match.status === "REJECTED" ? (
                                <div className="flex items-center gap-2 text-red-500/80">
                                    <X size={16} />
                                    <span className="text-xs font-bold">REJECTED</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-emerald-500/80">
                                    <CheckCircle2 size={16} />
                                    <span className="text-xs font-bold">VERIFIED</span>
                                </div>
                            )
                        )}

                        {/* Edit Button */}
                        {canEdit && !hasAdjustment && (
                            <button
                                onClick={onEdit}
                                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                                title="Adjust Match"
                            >
                                <Edit3 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
