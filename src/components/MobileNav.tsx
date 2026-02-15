"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Swords, Trophy, Award, User, Menu, X, LogOut, Settings, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import NotificationBell from "./NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";

export default function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);

    // Check if user is admin
    const isAdmin = (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SUPERADMIN";

    // Reordered: Home, Matches, Notifications (new), Rankings, More
    const navItems = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Home", highlight: false },
        { href: "/matches", icon: Swords, label: "Matches", highlight: true },
        { href: "/rankings", icon: Award, label: "Rank", highlight: false },
    ];

    const { unreadCount } = useNotifications();

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {/* Home */}
                    <Link
                        href="/dashboard"
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl min-w-[50px] transition-all",
                            pathname === "/dashboard" ? "text-primary" : "text-slate-400 active:text-white"
                        )}
                    >
                        <LayoutDashboard size={20} />
                        <span className="text-[10px] font-medium">Home</span>
                    </Link>

                    {/* Matches (Highlighted) */}
                    <Link
                        href="/matches"
                        className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl min-w-[56px] gradient-primary shadow-lg shadow-primary text-white transition-all transform active:scale-95"
                    >
                        <Swords size={24} className="text-white" />
                        <span className="text-[10px] font-medium text-white">Matches</span>
                    </Link>

                    {/* Notifications (Mobile Bell) */}
                    <div className="flex flex-col items-center justify-center min-w-[50px]">
                        <NotificationBell />
                        <span className="text-[10px] font-medium text-slate-400 -mt-1">Alerts</span>
                    </div>

                    {/* Rankings */}
                    <Link
                        href="/rankings"
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl min-w-[50px] transition-all",
                            pathname === "/rankings" ? "text-primary" : "text-slate-400 active:text-white"
                        )}
                    >
                        <Award size={20} />
                        <span className="text-[10px] font-medium">Rank</span>
                    </Link>

                    {/* More Menu */}
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg min-w-[50px] text-slate-400 active:text-white"
                    >
                        <Menu size={20} />
                        <span className="text-[10px] font-medium">More</span>
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
                                <div>
                                    <p className="text-white font-medium">{session?.user?.name || "Loading..."}</p>
                                    <p className="text-xs text-slate-400">{session?.user?.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setMenuOpen(false)} className="p-2 text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <Link
                                href="/profile"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 active:bg-slate-700 transition-colors"
                            >
                                <User size={20} />
                                <span>My Profile</span>
                            </Link>
                            <Link
                                href="/tournaments"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 active:bg-slate-700 transition-colors"
                            >
                                <Trophy size={20} />
                                <span>Tournaments</span>
                            </Link>
                            {isAdmin && (
                                <Link
                                    href="/settings"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 active:bg-slate-700 transition-colors"
                                >
                                    <Settings size={20} />
                                    <span>Settings</span>
                                </Link>
                            )}
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 active:bg-slate-700 transition-colors">
                                <NotificationBell />
                                <span>Notifications</span>
                            </div>
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
