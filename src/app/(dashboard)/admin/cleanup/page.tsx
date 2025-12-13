"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function AdminCleanupPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");
    const keepEmail = "jeroendekker635@gmail.com";

    const handleCleanup = async () => {
        if (!confirm(`Are you sure you want to delete ALL users except ${keepEmail}? This cannot be undone!`)) {
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await fetch(`/api/admin/cleanup-users?keepEmail=${encodeURIComponent(keepEmail)}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to cleanup users");
            } else {
                setResult(data);
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Admin: User Cleanup</h1>

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-4 mb-6">
                        <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
                        <div>
                            <h2 className="text-lg font-semibold text-amber-400">Warning</h2>
                            <p className="text-slate-400 text-sm mt-1">
                                This will permanently delete ALL users and their related data (matches, tournaments, etc.)
                                except for the user with email: <strong className="text-white">{keepEmail}</strong>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleCleanup}
                        disabled={loading}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Cleaning up...
                            </>
                        ) : (
                            <>
                                <Trash2 size={20} />
                                Delete All Other Users
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {result && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle className="text-emerald-500" size={24} />
                            <h3 className="text-lg font-semibold text-emerald-400">Cleanup Complete</h3>
                        </div>
                        <p className="text-slate-300 mb-4">{result.message}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-slate-800 rounded px-3 py-2">
                                <span className="text-slate-400">Users deleted:</span>
                                <span className="text-white ml-2">{result.deleted?.users || 0}</span>
                            </div>
                            <div className="bg-slate-800 rounded px-3 py-2">
                                <span className="text-slate-400">Matches deleted:</span>
                                <span className="text-white ml-2">{result.deleted?.matches || 0}</span>
                            </div>
                            <div className="bg-slate-800 rounded px-3 py-2">
                                <span className="text-slate-400">Games deleted:</span>
                                <span className="text-white ml-2">{result.deleted?.games || 0}</span>
                            </div>
                            <div className="bg-slate-800 rounded px-3 py-2">
                                <span className="text-slate-400">Tournaments deleted:</span>
                                <span className="text-white ml-2">{result.deleted?.tournaments || 0}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
