import { MOCK_MATCHES } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export default function MatchesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Matches</h2>
                    <p className="text-slate-500">History and pending results verification.</p>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
                    <Plus size={16} />
                    Log Match
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500">
                        <tr>
                            <th className="px-6 py-4 font-medium">Date</th>
                            <th className="px-6 py-4 font-medium">Players</th>
                            <th className="px-6 py-4 font-medium">Score</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Winner</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {MOCK_MATCHES.map((match) => (
                            <tr key={match.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                                <td className="px-6 py-4 text-slate-500">
                                    {new Date(match.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{match.player1.name}</span>
                                        <span className="text-slate-500 text-xs">vs</span>
                                        <span className="font-medium">{match.player2.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono">
                                    {match.score.map(s => `${s.p1}-${s.p2}`).join(", ")}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${match.status === 'VALIDATED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {match.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {match.winnerId ? (
                                        <span className="text-green-600 font-medium">
                                            {match.winnerId === match.player1.id ? match.player1.name : match.player2.name}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
