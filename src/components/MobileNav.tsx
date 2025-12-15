"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Swords, Trophy, Award, User, Menu, X, LogOut, Settings, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import NotificationBell from "./NotificationBell";

export default function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);

    // Check if user is admin
    const isAdmin = (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SUPERADMIN";

    // Reordered: Home, Tournaments, Matches (center/highlighted), Rankings, More
    const navItems = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Home", highlight: false },
        { href: "/tournaments", icon: Trophy, label: "Tourney", highlight: false },
        { href: "/matches", icon: Swords, label: "Matches", highlight: true },
        { href: "/rankings", icon: Award, label: "Rank", highlight: false },
    ];

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl min-w-[56px] transition-all",
                                item.highlight
                                    ? "gradient-primary shadow-lg shadow-primary text-white"
                                    : pathname === item.href
                                        ? "text-primary"
                                        : "text-slate-400 active:text-white"
                            )}
                        >
                            <item.icon size={item.highlight ? 24 : 20} className={item.highlight ? "text-white" : ""} />
                            <span className={cn("text-[10px] font-medium", item.highlight && "text-white")}>{item.label}</span>
                        </Link>
                    ))}
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg min-w-[60px] text-slate-400 active:text-white"
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
