"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Swords, Trophy, Award, User, Menu, X, LogOut, Settings, Bell, Plus, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import NotificationBell from "./NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";
import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"] });

export default function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);

    // Check if user is admin
    const isAdmin = (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SUPERADMIN";

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-arcade-slate-950/90 backdrop-blur-2xl border-t-2 border-slate-900 safe-area-bottom px-4 arcade-grid-bg">
                <div className="grid grid-cols-5 items-center h-20">
                    {/* Home */}
                    <MobileTab href="/dashboard" icon={<LayoutDashboard size={20} />} label="HOME" active={pathname === "/dashboard"} />

                    {/* Rankings */}
                    <MobileTab href="/rankings" icon={<Award size={20} />} label="RANK" active={pathname === "/rankings"} />

                    {/* Central Action (Matches) - Ergonomic Center */}
                    <div className="flex flex-col items-center justify-center relative -top-6">
                        <Link
                            href="/matches"
                            className={cn(
                                "flex items-center justify-center w-16 h-16 rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.5)] border-4 border-arcade-slate-950 active:scale-90 transition-all group",
                                pathname === "/matches" ? "bg-arcade-indigo text-white" : "bg-slate-900 text-slate-400"
                            )}
                        >
                            <Swords size={32} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                        </Link>
                        <span className={cn("text-[8px] font-black tracking-[0.2em] mt-8 text-arcade-indigo", mono.className)}>MATCHES</span>
                    </div>

                    {/* Notifications (Mobile Bell) */}
                    <div className="flex flex-col items-center justify-center min-w-[50px] gap-1">
                        <NotificationBell />
                        <span className={cn("text-[8px] font-black tracking-[0.2em] text-slate-500", mono.className)}>ALERTS</span>
                    </div>

                    {/* More Menu */}
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="flex flex-col items-center justify-center gap-1 px-3 min-w-[60px] text-slate-500 active:text-arcade-indigo transition-colors"
                    >
                        <Menu size={20} />
                        <span className={cn("text-[8px] font-black tracking-[0.2em]", mono.className)}>MORE</span>
                    </button>
                </div>
            </nav>

            {/* More Menu Overlay */}
            {menuOpen && (
                <div className="md:hidden fixed inset-0 z-[60] scanlines">
                    <div className="absolute inset-0 bg-arcade-slate-950/95 backdrop-blur-md" onClick={() => setMenuOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-arcade-slate-900 border-t-4 border-arcade-indigo rounded-t-[2.5rem] p-10 safe-area-bottom animate-in slide-in-from-bottom duration-500 arcade-grid-bg">
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-8 opacity-50" />

                        <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl border-2 border-arcade-indigo bg-arcade-slate-950 flex items-center justify-center text-white font-black overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                                        {session?.user?.image ? (
                                            <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            session?.user?.name?.charAt(0)?.toUpperCase() || "?"
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-arcade-emerald rounded-full border-4 border-arcade-slate-900 shadow-[0_0_10px_#10b981]" />
                                </div>
                                <div>
                                    <p className="text-xl font-black text-white uppercase tracking-tight leading-none mb-1">{session?.user?.name || "GUEST_USER"}</p>
                                    <div className="flex items-center gap-2">
                                        <Shield size={10} className="text-arcade-indigo" />
                                        <p className={cn("text-[10px] text-arcade-indigo font-bold tracking-widest", mono.className)}>USR_AUTHORIZED_V1</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setMenuOpen(false)} className="p-4 bg-arcade-slate-950 border-2 border-slate-800 rounded-2xl text-slate-400 active:scale-90 transition-all">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <MenuButton href="/profile" icon={<User size={20} />} label="OPERATOR_PROFILE" onClick={() => setMenuOpen(false)} />
                            <MenuButton href="/tournaments" icon={<Trophy size={20} />} label="ACTIVE_EVENTS" onClick={() => setMenuOpen(false)} />
                            <MenuButton href="/settings" icon={<Settings size={20} />} label="SYS_SETTINGS" onClick={() => setMenuOpen(false)} />
                            <MenuButton href="/matches/log" icon={<Plus size={20} />} label="NEW_LOG_ENTRY" onClick={() => setMenuOpen(false)} />

                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className={cn("col-span-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-arcade-rose/10 border-2 border-arcade-rose/30 text-arcade-rose font-black text-xs mt-6 tracking-[0.2em]", mono.className)}
                            >
                                <LogOut size={20} strokeWidth={3} />
                                TERMINATE_CONNECTION
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function MobileTab({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 min-w-[60px] transition-all",
                active ? "text-arcade-indigo" : "text-slate-500 active:text-white"
            )}
        >
            <div className={cn("p-1.5 rounded-lg transition-all", active ? "bg-arcade-indigo/10" : "")}>
                {icon}
            </div>
            <span className={cn("text-[8px] font-black tracking-[0.2em]", mono.className)}>{label}</span>
        </Link>
    )
}

function MenuButton({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex flex-col items-start gap-3 px-5 py-5 rounded-2xl bg-arcade-slate-950 border-2 border-slate-800 text-slate-400 active:border-arcade-indigo active:text-white transition-all overflow-hidden relative group"
        >
            <div className="text-arcade-indigo group-active:scale-110 transition-transform">{icon}</div>
            <span className={cn("text-[9px] font-black tracking-widest", mono.className)}>{label}</span>
            <div className="absolute top-0 right-0 w-8 h-8 bg-arcade-indigo/5 rounded-full -mr-4 -mt-4" />
        </Link>
    )
}
