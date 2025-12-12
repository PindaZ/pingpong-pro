"use client";

import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    description: string;
    gradient: string;
    trend: string;
}

export function StatCard({ title, value, icon, description, gradient, trend }: StatCardProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/50 backdrop-blur-md p-6 group transition-all hover:-translate-y-1 hover:border-slate-700">
            {/* Background glow */}
            <div className={cn("absolute top-0 right-0 w-[150px] h-[150px] opacity-10 blur-[60px] rounded-full bg-gradient-to-br", gradient)} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-3 rounded-xl shadow-lg bg-gradient-to-br", gradient)}>
                        {icon}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-800/50 px-2 py-1 rounded-full border border-slate-700/50">
                        {trend} <ArrowUpRight size={12} />
                    </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</div>
                <div className="text-sm text-slate-400 font-medium">{description}</div>
            </div>
        </div>
    );
}
