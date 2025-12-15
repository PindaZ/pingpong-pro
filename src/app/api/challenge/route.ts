import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/challenge - Send a challenge to another player
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { challengedUserId } = await request.json();

        if (!challengedUserId) {
            return NextResponse.json({ error: "Missing challenged user ID" }, { status: 400 });
        }

        // Can't challenge yourself
        if (challengedUserId === session.user.id) {
            return NextResponse.json({ error: "You cannot challenge yourself" }, { status: 400 });
        }

        // Check if challenged user exists
        const challengedUser = await db.user.findUnique({
            where: { id: challengedUserId },
        });

        if (!challengedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get challenger's name
        const challenger = await db.user.findUnique({
            where: { id: session.user.id },
            select: { name: true },
        });

        // For now, we'll create a notification-like record
        // Since we don't have a dedicated Notification model, we'll use a workaround
        // by creating a PENDING match that serves as the challenge
        // The challenged player can accept (keeping the match) or reject (deleting it)

        // Check if there's already a pending challenge between these players
        const existingChallenge = await db.match.findFirst({
            where: {
                OR: [
                    { player1Id: session.user.id, player2Id: challengedUserId },
                    { player1Id: challengedUserId, player2Id: session.user.id },
                ],
                status: "PENDING",
                winnerId: null, // No result yet = this is a challenge, not a logged match
            },
        });

        if (existingChallenge) {
            return NextResponse.json({ error: "A challenge between you is already pending" }, { status: 400 });
        }

        // Create a "challenge" match (PENDING with no winner/games = challenge)
        const challenge = await db.match.create({
            data: {
                player1Id: session.user.id, // Challenger
                player2Id: challengedUserId, // Challenged
                status: "PENDING",
                // No winner, no games = indicates this is a challenge
            },
        });

        return NextResponse.json({
            success: true,
            message: `Challenge sent to ${challengedUser.name}`,
            challengeId: challenge.id
        });

    } catch (error) {
        console.error("Challenge error:", error);
        return NextResponse.json({ error: "Failed to send challenge" }, { status: 500 });
    }
}
