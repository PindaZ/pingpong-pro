import Link from "next/link";
import { Trophy, Swords, LayoutDashboard, User, LogOut, Disc } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
            {/* Premium Sidebar */}
            <aside className="w-72 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/60 hidden md:flex flex-col relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-[80px]" />
                </div>

                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                            <Disc className="text-white animate-spin-slow" size={24} />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                            PingPong<span className="text-indigo-400">Pro</span>
                        </h1>
                    </div>

                    <div className="px-4 py-3 bg-slate-800/40 rounded-xl border border-slate-700/50 backdrop-blur-sm mb-6">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Current Season</p>
                        <p className="text-sm font-semibold text-white">Winter League '23</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" />
                    <NavItem href="/matches" icon={<Swords size={20} />} label="Matches" />
                    <NavItem href="/tournaments" icon={<Trophy size={20} />} label="Tournaments" />
                    <NavItem href="/profile" icon={<User size={20} />} label="My Profile" />
                </nav>

                <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative">
                            <img src="https://i.pravatar.cc/150?u=1" alt="User" className="w-10 h-10 rounded-full ring-2 ring-indigo-500/50" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">Alex Chen</p>
                            <p className="text-xs text-indigo-400 truncate">ELO: 1450</p>
                        </div>
                    </div>
                    <button className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 w-full py-2 rounded-lg transition-all duration-200 group">
                        <LogOut size={14} className="group-hover:text-red-400 transition-colors" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Top Mesh Gradient */}
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="flex-1 overflow-auto p-8 relative z-10 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 group"
        >
            <span className="group-hover:text-indigo-400 transition-colors duration-200">{icon}</span>
            <span className="font-medium tracking-wide">{label}</span>
        </Link>
    )
}
