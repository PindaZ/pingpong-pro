import Link from "next/link";
import { Trophy, Swords, LayoutDashboard, User, LogOut } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-row">
            {/* Sidebar - Desktop */}
            <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent italic">
                        PingPong Pro
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <NavItem href="/matches" icon={<Swords size={20} />} label="Matches" />
                    <NavItem href="/tournaments" icon={<Trophy size={20} />} label="Tournaments" />
                    <NavItem href="/profile" icon={<User size={20} />} label="Profile" />
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <img src="https://i.pravatar.cc/150?u=1" alt="User" className="w-10 h-10 rounded-full bg-slate-200" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Alex Chen</p>
                            <p className="text-xs text-slate-500 truncate">alex@example.com</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 w-full p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header (simplified) */}
            {/* For MVP UI shell, we assume desktop first or basic stacking for now */}

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                {children}
            </main>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
        >
            {icon}
            <span className="font-medium">{label}</span>
        </Link>
    )
}
