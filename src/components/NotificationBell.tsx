"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
    id: string;
    type: "MATCH_VALIDATION";
    message: string;
    matchId: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const handleValidate = async (matchId: string, action: "confirm" | "reject") => {
        setLoading(true);
        try {
            const res = await fetch(`/api/matches/${matchId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                // Mark as read and refresh
                await fetch(`/api/notifications/${matchId}`, { method: "PATCH" });
                fetchNotifications();
                router.refresh();
            }
        } catch (error) {
            console.error("Validation failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
                <Bell size={20} className="text-slate-400" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-800">
                            <h4 className="font-semibold text-white">Notifications</h4>
                        </div>

                        <div className="max-h-80 overflow-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-slate-500 text-sm">
                                    No notifications
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-slate-800 last:border-0 ${!notification.read ? "bg-indigo-500/5" : ""
                                            }`}
                                    >
                                        <p className="text-sm text-slate-300 mb-2">{notification.message}</p>

                                        {notification.type === "MATCH_VALIDATION" && !notification.read && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleValidate(notification.matchId, "confirm")}
                                                    disabled={loading}
                                                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 disabled:opacity-50"
                                                >
                                                    <Check size={14} /> Confirm
                                                </button>
                                                <button
                                                    onClick={() => handleValidate(notification.matchId, "reject")}
                                                    disabled={loading}
                                                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 disabled:opacity-50"
                                                >
                                                    <X size={14} /> Reject
                                                </button>
                                            </div>
                                        )}

                                        <p className="text-xs text-slate-500 mt-2">
                                            {new Date(notification.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
