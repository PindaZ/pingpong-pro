"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ColorProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();

    useEffect(() => {
        // Only fetch settings when logged in
        if (status !== "authenticated") return;

        const loadColors = async () => {
            try {
                const res = await fetch("/api/settings");
                if (res.ok) {
                    const data = await res.json();
                    // Apply colors as CSS variables
                    document.documentElement.style.setProperty("--color-primary", data.primaryColor);
                    document.documentElement.style.setProperty("--color-secondary", data.secondaryColor);
                }
            } catch (err) {
                console.error("Failed to load color settings:", err);
            }
        };

        loadColors();
    }, [status]);

    return <>{children}</>;
}
