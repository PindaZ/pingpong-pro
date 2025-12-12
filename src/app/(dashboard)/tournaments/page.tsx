import { MOCK_TOURNAMENTS } from "@/lib/mock-data";
import { Plus, Calendar, Users } from "lucide-react";

export default function TournamentsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tournaments</h2>
                    <p className="text-slate-500">Compete for the ultimate glory.</p>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
                    <Plus size={16} />
                    Create Tournament
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {MOCK_TOURNAMENTS.map((t) => (
                    <div key={t.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 p-6 flex items-end">
                            <h3 className="text-white font-bold text-xl">{t.name}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Calendar size={16} />
                                <span>{new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Users size={16} />
                                <span>{t.participants} Participants</span>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700' : 'bg-green-100 text-green-700'}`}>
                                    {t.status}
                                </span>
                                {t.winner && (
                                    <div className="mt-2 text-sm">
                                        <span className="text-slate-500">Winner: </span>
                                        <span className="font-medium text-amber-600">🏆 {t.winner.name}</span>
                                    </div>
                                )}
                            </div>

                            <button className="w-full mt-2 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                View Bracket
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
