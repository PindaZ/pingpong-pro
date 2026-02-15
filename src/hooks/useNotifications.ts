"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export interface Notification {
    id: string;
    type: "CHALLENGE" | "MATCH_VALIDATION";
    message: string;
    matchId: string;
    challengerId?: string;
    read: boolean;
    createdAt: string;
}

export function useNotifications() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!session) return;

        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                const fetchedNotifications = data.notifications || [];
                setNotifications(fetchedNotifications);
                setUnreadCount(fetchedNotifications.filter((n: Notification) => !n.read).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchNotifications();

        // Polling every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        refresh: fetchNotifications
    };
}
