"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Trophy, Swords, LayoutDashboard, User, LogOut, Disc, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";

import { Logo } from "@/components/Logo";

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <aside className="w-72 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/60 hidden md:flex flex-col relative z-50">
            {/* Decorative background glow */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-[80px]" />
            </div>

            <div className="p-8 pb-4">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                        <Logo className="text-white animate-spin-slow w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                        PingPong<span className="text-indigo-400">&apos;r</span>
                    </h1>
                </div>


            </div>

            <nav className="flex-1 px-4 space-y-2">
                <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" active={pathname === "/dashboard"} />
                <NavItem href="/matches" icon={<Swords size={20} />} label="Matches" active={pathname === "/matches"} />
                <NavItem href="/tournaments" icon={<Trophy size={20} />} label="Tournaments" active={pathname === "/tournaments"} />
                <NavItem href="/rankings" icon={<Award size={20} />} label="Rankings" active={pathname === "/rankings"} />
                <NavItem href="/profile" icon={<User size={20} />} label="My Profile" active={pathname === "/profile"} />
            </nav>

            <div className="px-4 mb-2">
                <NotificationBell />
            </div>

            <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full ring-2 ring-indigo-500/50 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
                            {session?.user?.image ? (
                                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                session?.user?.name?.charAt(0)?.toUpperCase() || "?"
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                            {session?.user?.name || "Loading..."}
                        </p>
                        <p className="text-xs text-indigo-400 truncate">
                            {session?.user?.email || ""}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 w-full py-2 rounded-lg transition-all duration-200 group"
                >
                    <LogOut size={14} className="group-hover:text-red-400 transition-colors" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                active
                    ? "bg-indigo-600/10 text-white border border-indigo-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
        >
            <span className={cn("transition-colors duration-200", active ? "text-indigo-400" : "group-hover:text-indigo-400")}>
                {icon}
            </span>
            <span className="font-medium tracking-wide">{label}</span>
        </Link>
    );
}
