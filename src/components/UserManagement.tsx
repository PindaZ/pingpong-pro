"use client";

import { useState, useEffect } from "react";
import { Users, Shield, ShieldCheck, Trash2, Loader2, Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
    id: string;
    name: string | null;
    email: string;
    role: "USER" | "ADMIN" | "SUPERADMIN";
    avatarUrl: string | null;
    createdAt: string;
}

export default function UserManagement({ currentUserRole }: { currentUserRole: string }) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                setError("Failed to fetch users");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const updateRole = async (userId: string, newRole: string) => {
        setActioning(userId);
        setError("");
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
            } else {
                const data = await res.json();
                setError(data || "Failed to update role");
            }
        } catch (err) {
            setError("Action failed");
        } finally {
            setActioning(null);
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        setActioning(userId);
        setError("");
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId));
            } else {
                const data = await res.json();
                setError(data || "Failed to delete user");
            }
        } catch (err) {
            setError("Action failed");
        } finally {
            setActioning(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="text-primary" size={20} />
                    <h3 className="text-lg font-semibold text-white">Project Members</h3>
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-800 px-2 py-1 rounded">
                    {users.length} Total
                </span>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-sm">
                    <AlertTriangle size={16} />
                    {typeof error === 'string' ? error : "An error occurred"}
                </div>
            )}

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/30">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold ring-2 ring-slate-800 group-hover:ring-primary/30 transition-all overflow-hidden flex-shrink-0">
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    user.name?.charAt(0) || user.email.charAt(0)
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-white truncate">
                                                    {user.name || "Unnamed User"}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-700 bg-slate-800/50">
                                            {user.role === "SUPERADMIN" ? (
                                                <>
                                                    <ShieldCheck size={12} className="text-amber-400" />
                                                    <span className="text-amber-400">Owner</span>
                                                </>
                                            ) : user.role === "ADMIN" ? (
                                                <>
                                                    <Shield size={12} className="text-primary" />
                                                    <span className="text-primary">Admin</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Users size={12} className="text-slate-400" />
                                                    <span className="text-slate-400">User</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 outline-none">
                                            {user.role !== "SUPERADMIN" && (
                                                <>
                                                    {currentUserRole === "SUPERADMIN" && (
                                                        <button
                                                            onClick={() => updateRole(user.id, user.role === "ADMIN" ? "USER" : "ADMIN")}
                                                            disabled={actioning === user.id}
                                                            className={cn(
                                                                "p-2 rounded-lg transition-all",
                                                                user.role === "ADMIN"
                                                                    ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                                                                    : "hover:bg-primary/20 text-slate-400 hover:text-primary"
                                                            )}
                                                            title={user.role === "ADMIN" ? "Revoke Admin" : "Make Admin"}
                                                        >
                                                            {actioning === user.id ? (
                                                                <Loader2 size={16} className="animate-spin" />
                                                            ) : user.role === "ADMIN" ? (
                                                                <ShieldCheck size={16} />
                                                            ) : (
                                                                <Shield size={16} />
                                                            )}
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => deleteUser(user.id)}
                                                        disabled={actioning === user.id || (user.role === "ADMIN" && currentUserRole !== "SUPERADMIN")}
                                                        className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all disabled:opacity-30"
                                                        title="Delete Member"
                                                    >
                                                        {actioning === user.id ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={16} />
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-4">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 mt-0.5">
                    <ShieldCheck size={18} />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">Administrator Rules</p>
                    <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
                        <li>Only <strong>SUPERADMIN</strong> can promote/demote other Admins.</li>
                        <li><strong>SUPERADMIN</strong> cannot be removed or modified.</li>
                        <li>Existing Admins can manage regular users but not other Admins.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
