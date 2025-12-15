import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Get pending match validations and challenges as "notifications" for the current user
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get pending matches where user is player2 (the one who needs to validate/accept)
        const pendingMatches = await db.match.findMany({
            where: {
                player2Id: session.user.id,
                status: "PENDING",
            },
            include: {
                player1: { select: { name: true } },
                games: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Transform to notification format
        // Distinguish between challenges (no games) and match validations (has games)
        const notifications = pendingMatches.map((match) => {
            const isChallenge = match.games.length === 0 && match.winnerId === null;

            return {
                id: match.id,
                type: isChallenge ? "CHALLENGE" : "MATCH_VALIDATION" as const,
                message: isChallenge
                    ? `${match.player1.name || "Someone"} challenged you to a match!`
                    : `${match.player1.name || "Someone"} submitted a match result against you`,
                matchId: match.id,
                challengerId: isChallenge ? match.player1Id : undefined,
                read: false,
                createdAt: match.createdAt.toISOString(),
            };
        });

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error("[NOTIFICATIONS_GET]", error);
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}
