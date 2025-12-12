import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
            {/* Premium Sidebar */}
            <Sidebar />

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

