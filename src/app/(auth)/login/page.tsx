"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (res?.error) {
                setError("Invalid email or password");
                setLoading(false);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 mb-4">
                        <Logo className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Welcome Back</h1>
                    <p className="text-slate-400 text-sm mt-1">Sign in to continue your streak</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

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
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Password</label>
                            <Link href="#" className="text-xs text-primary hover:text-primary">Forgot?</Link>
                        </div>
                        <input
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl btn-primary text-white font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-800 text-center text-sm text-slate-500">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-primary font-semibold hover:text-primary transition-colors">
                        Register for free
                    </Link>
                </div>
            </div>
        </div>
    );
}
