import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Validate (confirm/reject) a match
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { action } = body; // "confirm" or "reject"

        if (!action || !["confirm", "reject"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        // Get the match
        const match = await db.match.findUnique({
            where: { id },
            include: {
                player1: true,
                player2: true,
                games: true,
            },
        });

        if (!match) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        // Only the opponent (player2) can validate
        if (match.player2Id !== session.user.id) {
            return NextResponse.json({ error: "Only the opponent can validate this match" }, { status: 403 });
        }

        if (match.status !== "PENDING") {
            return NextResponse.json({ error: "Match is not pending validation" }, { status: 400 });
        }

        if (action === "reject") {
            await db.match.update({
                where: { id },
                data: { status: "REJECTED" },
            });
            return NextResponse.json({ success: true, status: "REJECTED" });
        }

        // action === "confirm"
        // Calculate winner
        let player1Wins = 0;
        let player2Wins = 0;

        for (const game of match.games) {
            if (game.scorePlayer1 > game.scorePlayer2) {
                player1Wins++;
            } else {
                player2Wins++;
            }
        }

        const winnerId = player1Wins > player2Wins ? match.player1Id : match.player2Id;

        // Update ELO ratings
        const K = 32; // ELO K-factor
        const player1Elo = match.player1.elo;
        const player2Elo = match.player2.elo;

        const expectedPlayer1 = 1 / (1 + Math.pow(10, (player2Elo - player1Elo) / 400));
        const expectedPlayer2 = 1 - expectedPlayer1;

        const player1Won = winnerId === match.player1Id;
        const actualPlayer1 = player1Won ? 1 : 0;
        const actualPlayer2 = player1Won ? 0 : 1;

        const newPlayer1Elo = Math.round(player1Elo + K * (actualPlayer1 - expectedPlayer1));
        const newPlayer2Elo = Math.round(player2Elo + K * (actualPlayer2 - expectedPlayer2));

        // Update match and players in a transaction
        await db.$transaction([
            db.match.update({
                where: { id },
                data: {
                    status: "VALIDATED",
                    winnerId,
                },
            }),
            db.user.update({
                where: { id: match.player1Id },
                data: { elo: newPlayer1Elo },
            }),
            db.user.update({
                where: { id: match.player2Id },
                data: { elo: newPlayer2Elo },
            }),
            db.rankingLog.create({
                data: {
                    userId: match.player1Id,
                    matchId: id,
                    eloBefore: player1Elo,
                    eloAfter: newPlayer1Elo,
                    change: newPlayer1Elo - player1Elo,
                },
            }),
            db.rankingLog.create({
                data: {
                    userId: match.player2Id,
                    matchId: id,
                    eloBefore: player2Elo,
                    eloAfter: newPlayer2Elo,
                    change: newPlayer2Elo - player2Elo,
                },
            }),
        ]);

        return NextResponse.json({
            success: true,
            status: "VALIDATED",
            winner: winnerId,
            eloChanges: {
                player1: { from: player1Elo, to: newPlayer1Elo },
                player2: { from: player2Elo, to: newPlayer2Elo },
            },
        });
    } catch (error) {
        console.error("[MATCH_VALIDATE]", error);
        return NextResponse.json({ error: "Failed to validate match" }, { status: 500 });
    }
}
