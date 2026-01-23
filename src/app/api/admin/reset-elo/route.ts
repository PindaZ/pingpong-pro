import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Admin-only endpoint to reset all ELO scores to default (1200)
// POST /api/admin/reset-elo
// Optional query params:
//   - confirmReset=true (required to actually execute)
//   - clearRankingLogs=true (also delete ranking history)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin or superadmin
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, email: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const url = new URL(req.url);
        const confirmReset = url.searchParams.get("confirmReset") === "true";
        const clearRankingLogs = url.searchParams.get("clearRankingLogs") === "true";

        // Get current stats before reset
        const usersCount = await db.user.count();
        const usersWithNonDefaultElo = await db.user.count({
            where: { elo: { not: 1200 } }
        });

        if (!confirmReset) {
            // Preview mode - show what would be affected
            return NextResponse.json({
                message: "Preview mode. Add ?confirmReset=true to execute.",
                preview: {
                    totalUsers: usersCount,
                    usersWithModifiedElo: usersWithNonDefaultElo,
                    eloWillBeResetTo: 1200,
                    rankingLogsWillBeClear: clearRankingLogs
                }
            });
        }

        console.log(`[ELO_RESET] Admin ${user.email} initiating ELO reset for ${usersCount} users`);

        // Reset all ELO scores to 1200
        const updateResult = await db.user.updateMany({
            data: { elo: 1200 }
        });

        console.log(`[ELO_RESET] Reset ${updateResult.count} users to ELO 1200`);

        let rankingLogsDeleted = 0;
        if (clearRankingLogs) {
            const logsResult = await db.rankingLog.deleteMany({});
            rankingLogsDeleted = logsResult.count;
            console.log(`[ELO_RESET] Deleted ${rankingLogsDeleted} ranking logs`);
        }

        return NextResponse.json({
            success: true,
            message: "ELO reset complete",
            result: {
                usersReset: updateResult.count,
                newElo: 1200,
                rankingLogsDeleted: clearRankingLogs ? rankingLogsDeleted : "not cleared"
            },
            executedBy: user.email,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("[ELO_RESET] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET endpoint for easier browser/curl testing
export async function GET(req: NextRequest) {
    return POST(req);
}
