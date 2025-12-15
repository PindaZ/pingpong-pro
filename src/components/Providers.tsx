"use client";

import { SessionProvider } from "next-auth/react";
import ColorProvider from "./ColorProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ColorProvider>{children}</ColorProvider>
        </SessionProvider>
    );
}
