"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Crown, Medal } from "lucide-react";

interface LeaderboardItemProps {
    user: {
        id: string;
        name: string | null;
        elo: number;
    };
    rank: number;
}

export function LeaderboardItem({ user, rank }: LeaderboardItemProps) {
    let rankIcon;
    let rankColor = "text-slate-400 bg-slate-800 border-slate-700";

    if (rank === 1) {
        rankIcon = <Crown size={14} className="text-amber-400" fill="currentColor" />;
        rankColor = "text-amber-400 bg-amber-500/10 border-amber-500/20 ring-1 ring-amber-500/30";
    } else if (rank === 2) {
        rankIcon = <Medal size={14} className="text-slate-300" />;
        rankColor = "text-slate-300 bg-slate-400/10 border-slate-400/20 ring-1 ring-slate-400/30";
    } else if (rank === 3) {
        rankIcon = <Medal size={14} className="text-orange-400" />;
        rankColor = "text-orange-400 bg-orange-500/10 border-orange-500/20 ring-1 ring-orange-500/30";
    }

    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border shadow-sm transition-transform group-hover:scale-110", rankColor)}>
                    {rankIcon || rank}
                </div>
                <div>
                    <Link href={`/profile/${user.id}`} className="font-medium text-slate-200 group-hover:text-white transition-colors hover:underline hover:text-indigo-400">
                        {user.name}
                    </Link>
                    <div className="text-xs text-slate-500">ELO {user.elo}</div>
                </div>
            </div>
            <div className="font-mono font-bold text-slate-300">{user.elo}</div>
        </div>
    );
}
