"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Swords, Trophy, Award, User, Menu, X, LogOut, Settings, Bell, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import NotificationBell from "./NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";

export default function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);

    // Check if user is superadmin
    const isSuperadmin = (session?.user as any)?.globalRole === "SUPERADMIN";

    const { unreadCount } = useNotifications();

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 safe-area-bottom">
                <div className="grid grid-cols-5 items-center h-16 px-1">
                    {/* Home */}
                    <Link
                        href="/dashboard"
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
                            pathname === "/dashboard" ? "text-primary" : "text-slate-400 active:text-white"
                        )}
                    >
                        <LayoutDashboard size={18} />
                        <span className="text-[9px] font-medium">Home</span>
                    </Link>

                    {/* Tournaments */}
                    <Link
                        href="/tournaments"
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
                            pathname === "/tournaments" ? "text-primary" : "text-slate-400 active:text-white"
                        )}
                    >
                        <Trophy size={18} />
                        <span className="text-[9px] font-medium">Tourney</span>
                    </Link>

                    {/* Rankings */}
                    <Link
                        href="/rankings"
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
                            pathname === "/rankings" ? "text-primary" : "text-slate-400 active:text-white"
                        )}
                    >
                        <Award size={18} />
                        <span className="text-[9px] font-medium">Rank</span>
                    </Link>

                    {/* Matches */}
                    <Link
                        href="/matches"
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
                            pathname === "/matches" ? "text-primary" : "text-slate-400 active:text-white"
                        )}
                    >
                        <Swords size={18} />
                        <span className="text-[9px] font-medium">Matches</span>
                    </Link>

                    {/* More Menu */}
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-slate-400 active:text-white"
                    >
                        <Menu size={18} />
                        <span className="text-[9px] font-medium">More</span>
                    </button>
                </div>
            </nav>

            {/* More Menu Overlay */}
            {menuOpen && (
                <div className="md:hidden fixed inset-0 z-[60]">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 rounded-t-2xl p-6 safe-area-bottom animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold overflow-hidden">
                                    {session?.user?.image ? (
                                        <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        session?.user?.name?.charAt(0)?.toUpperCase() || "?"
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-white font-medium truncate">{session?.user?.name || "Loading..."}</p>
                                    <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setMenuOpen(false)} className="p-2 text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <NotificationBell variant="menuItem" />

                            <Link
                                href="/profile"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 active:bg-slate-700 transition-colors"
                            >
                                <User size={20} />
                                <span>My Profile</span>
                            </Link>

                            {isSuperadmin && (
                                <Link
                                    href="/settings"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 active:bg-slate-700 transition-colors"
                                >
                                    <Settings size={20} />
                                    <span>Settings</span>
                                </Link>
                            )}
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-slate-800 active:bg-slate-700 w-full transition-colors"
                            >
                                <LogOut size={20} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}
