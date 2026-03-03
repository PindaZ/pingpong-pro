"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [registeredName, setRegisteredName] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const organizationCode = formData.get("organizationCode") as string;

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, organizationCode }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg);
            }

            setRegisteredName(name.split(" ")[0]);
            setSuccess(true);

            // Redirect to login after 2.5 seconds so the user can see the success state
            setTimeout(() => {
                router.push("/login?registered=true");
            }, 2500);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
            setLoading(false);
        }
    };

    // Success state — shown after registration
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />

                <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-10 rounded-3xl shadow-2xl relative z-10 flex flex-col items-center text-center">
                    {/* Animated checkmark */}
                    <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center animate-pulse">
                            <CheckCircle2 className="text-emerald-400 w-10 h-10" strokeWidth={1.5} />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl" />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">
                        Welcome, {registeredName}! 🎉
                    </h1>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        Your account has been created successfully.<br />
                        Redirecting you to sign in…
                    </p>

                    {/* Progress bar */}
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                                animation: "growWidth 2.5s linear forwards",
                            }}
                        />
                    </div>

                    <style>{`
                        @keyframes growWidth {
                            from { width: 0%; }
                            to { width: 100%; }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 mb-4">
                        <Logo className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Create Account</h1>
                    <p className="text-slate-400 text-sm mt-1">Join the competition today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Full Name</label>
                        <input
                            name="name"
                            type="text"
                            placeholder="Alex Chen"
                            required
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="you@company.com"
                            required
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            placeholder="Create a strong password"
                            required
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Organization Code</label>
                        <input
                            name="organizationCode"
                            type="text"
                            placeholder="Enter code from your ping pong table"
                            required
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all uppercase"
                        />
                        <p className="text-xs text-slate-500 ml-1 mt-1">Ask your admin for the organization invite code</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl btn-primary text-white font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Create Account"}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-800 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary font-semibold hover:text-primary transition-colors">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
