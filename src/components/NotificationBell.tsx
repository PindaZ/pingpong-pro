"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, Check, X, Trophy, Swords } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Notification {
    id: string;
    type: "MATCH_VALIDATION" | "CHALLENGE" | any;
    message: string;
    matchId: string;
    challengerId?: string;
    read: boolean;
    createdAt: string;
}

import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationBell() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const { notifications, unreadCount, loading: hookLoading, refresh } = useNotifications();
    const [localLoading, setLocalLoading] = useState(false);

    const loading = hookLoading || localLoading;

    const handleValidate = async (matchId: string, action: "confirm" | "reject") => {
        setLocalLoading(true);
        try {
            const res = await fetch(`/api/matches/${matchId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                // Match validation automatically clears the notification (status changes from PENDING)
                refresh();
                router.refresh();
            }
        } catch (error) {
            console.error("Validation failed:", error);
        } finally {
            setLocalLoading(false);
        }
    };

    const handleChallengeResponse = async (matchId: string, action: "accept" | "decline") => {
        setLocalLoading(true);
        try {
            if (action === "decline") {
                // Delete the challenge match
                await fetch(`/api/matches/${matchId}`, {
                    method: "DELETE",
                });
                refresh();
            } else {
                // Accept: Update status to ACCEPTED
                const res = await fetch(`/api/matches/${matchId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "accept_challenge" }),
                });

                if (res.ok) {
                    refresh();
                    router.push(`/dashboard?challengeAccepted=${matchId}`);
                }
            }
        } catch (error) {
            console.error("Challenge response failed:", error);
        } finally {
            setLocalLoading(false);
        }
    };



    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95"
            >
                <Bell size={20} className={cn("text-slate-400 transition-colors", open && "text-white")} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 border-2 border-slate-950 shadow-[0_0_10px_rgba(225,29,72,0.5)]"></span>
                    </span>
                )}
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <>
                    <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 z-[9999] overflow-hidden ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-5 py-4 border-b border-slate-800/50 flex items-center justify-between">
                            <h4 className="font-semibold text-white">Notifications</h4>
                            {unreadCount > 0 && (
                                <span className="text-xs font-medium text-primary bg-primary-10 px-2 py-1 rounded-full border border-primary-20">
                                    {unreadCount} pending
                                </span>
                            )}
                        </div>

                        <div className="max-h-[60vh] overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
                                        <Bell size={20} className="text-slate-600" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-400">All caught up!</p>
                                    <p className="text-xs text-slate-500 mt-1">No new notifications.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800/50">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "p-4 transition-colors hover:bg-slate-800/30",
                                                !notification.read ? "bg-primary-10 relative" : ""
                                            )}
                                        >
                                            {!notification.read && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                            )}
                                            <div className="flex gap-4">
                                                <div className="mt-1">
                                                    <div className="w-8 h-8 rounded-full bg-primary-10 border border-primary-20 flex items-center justify-center text-primary">
                                                        <Trophy size={14} />
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <div>
                                                        <p className="text-sm text-slate-200 leading-relaxed font-medium">
                                                            Match Result
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-medium">
                                                            {new Date(notification.createdAt).toLocaleDateString(undefined, {
                                                                month: "short",
                                                                day: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit"
                                                            })}
                                                        </p>
                                                    </div>

                                                    {notification.type === "MATCH_VALIDATION" && !notification.read && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleValidate(notification.matchId, "confirm")}
                                                                disabled={loading}
                                                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/20"
                                                            >
                                                                <Check size={14} /> Confirm
                                                            </button>
                                                            <button
                                                                onClick={() => handleValidate(notification.matchId, "reject")}
                                                                disabled={loading}
                                                                className="flex-1 py-2 bg-slate-700 hover:bg-red-600/90 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/20 border border-slate-600 hover:border-transparent"
                                                            >
                                                                <X size={14} /> Reject
                                                            </button>
                                                        </div>
                                                    )}

                                                    {notification.type === "CHALLENGE" && !notification.read && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleChallengeResponse(notification.matchId, "accept")}
                                                                disabled={loading}
                                                                className="flex-1 py-2 btn-primary text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all hover:scale-[1.02]"
                                                            >
                                                                <Swords size={14} /> Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleChallengeResponse(notification.matchId, "decline")}
                                                                disabled={loading}
                                                                className="flex-1 py-2 bg-slate-700 hover:bg-red-600/90 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all hover:scale-[1.02] border border-slate-600 hover:border-transparent"
                                                            >
                                                                <X size={14} /> Decline
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}
