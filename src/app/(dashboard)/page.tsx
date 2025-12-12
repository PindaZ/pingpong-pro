import { MOCK_USERS, MOCK_MATCHES } from "@/lib/mock-data";
import { TrendingUp, Award, Activity } from "lucide-react";

export default function DashboardPage() {
    const currentUser = MOCK_USERS[0];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-slate-500">Welcome back, {currentUser.name}. Here is your stats overview.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                    title="Current ELO"
                    value={currentUser.elo.toString()}
                    icon={<TrendingUp className="text-blue-500" />}
                    description="Top 15% of players"
                />
                <StatCard
                    title="Win Rate"
                    value={`${Math.round((currentUser.wins / (currentUser.wins + currentUser.losses)) * 100)}%`}
                    icon={<Activity className="text-green-500" />}
                    description={`${currentUser.wins}W - ${currentUser.losses}L`}
                />
                <StatCard
                    title="Rank"
                    value="#3"
                    icon={<Award className="text-amber-500" />}
                    description="Season 1"
                />
            </div>

            {/* Recent Matches & Leaderboard */}
            <div className="grid gap-8 md:grid-cols-2">
                {/* Recent Activity */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {MOCK_MATCHES.slice(0, 3).map((match) => (
                            <div key={match.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${match.winnerId === currentUser.id ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <div className="text-sm">
                                        <span className="font-medium">vs {match.player1.id === currentUser.id ? match.player2.name : match.player1.name}</span>
                                        <div className="text-xs text-slate-500">
                                            {match.score.map((s, i) => (
                                                <span key={i} className="mr-2">{s.p1}-{s.p2}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${match.status === 'VALIDATED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {match.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Players */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="font-semibold text-lg mb-4">Top Players</h3>
                    <div className="space-y-4">
                        {MOCK_USERS.sort((a, b) => b.elo - a.elo).slice(0, 5).map((user, idx) => (
                            <div key={user.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-400 font-mono w-4">{idx + 1}</span>
                                    <img src={user.avatar} className="w-8 h-8 rounded-full" />
                                    <span className="font-medium text-sm">{user.name}</span>
                                </div>
                                <span className="text-sm font-bold">{user.elo}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description: string }) {
    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                {icon}
            </div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-xs text-slate-500">{description}</div>
        </div>
    )
}
