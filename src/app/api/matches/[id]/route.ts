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

// Edit a pending match (only submitter can edit)
export async function PUT(
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
        const { games } = body; // array of { scorePlayer1, scorePlayer2 }

        if (!games || !Array.isArray(games) || games.length === 0) {
            return NextResponse.json({ error: "Games are required" }, { status: 400 });
        }

        // Get the match
        const match = await db.match.findUnique({
            where: { id },
            include: { games: true },
        });

        if (!match) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        // Only the submitter (player1) can edit
        if (match.player1Id !== session.user.id) {
            return NextResponse.json({ error: "Only the match submitter can edit this match" }, { status: 403 });
        }

        if (match.status !== "PENDING") {
            return NextResponse.json({ error: "Only pending matches can be edited" }, { status: 400 });
        }

        // Delete existing games and create new ones
        await db.$transaction([
            db.game.deleteMany({ where: { matchId: id } }),
            db.game.createMany({
                data: games.map((game: { scorePlayer1: number; scorePlayer2: number }, index: number) => ({
                    matchId: id,
                    setNumber: index + 1,
                    scorePlayer1: game.scorePlayer1,
                    scorePlayer2: game.scorePlayer2,
                })),
            }),
        ]);

        return NextResponse.json({ success: true, message: "Match updated successfully" });
    } catch (error) {
        console.error("[MATCH_EDIT]", error);
        return NextResponse.json({ error: "Failed to edit match" }, { status: 500 });
    }
}

// Delete a match (pending = immediate, verified = needs opponent approval)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const url = new URL(req.url);
        const action = url.searchParams.get("action"); // "request" or "approve"

        const match = await db.match.findUnique({
            where: { id },
            include: { games: true },
        });

        if (!match) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        const isPlayer1 = match.player1Id === session.user.id;
        const isPlayer2 = match.player2Id === session.user.id;

        if (!isPlayer1 && !isPlayer2) {
            return NextResponse.json({ error: "You are not a participant in this match" }, { status: 403 });
        }

        // If match is PENDING or REJECTED, either player can delete immediately
        if (match.status === "PENDING" || match.status === "REJECTED") {
            await db.$transaction([
                db.game.deleteMany({ where: { matchId: id } }),
                db.match.delete({ where: { id } }),
            ]);
            return NextResponse.json({ success: true, message: "Match deleted" });
        }

        // For VALIDATED matches, need opponent approval
        if (match.status === "VALIDATED") {
            // If match already pending deletion, the other player can approve
            if (match.deletionRequestedBy) {
                // The requester cannot approve their own request
                if (match.deletionRequestedBy === session.user.id) {
                    return NextResponse.json({
                        error: "Waiting for opponent to approve deletion",
                        pendingDeletion: true
                    }, { status: 400 });
                }

                // Other player is approving - reverse ELO changes and delete
                const player1 = await db.user.findUnique({ where: { id: match.player1Id } });
                const player2 = await db.user.findUnique({ where: { id: match.player2Id } });



                // Find ranking logs for this match to reverse ELO changes
                const rankingLogs = await db.rankingLog.findMany({ where: { matchId: id } });

                const updates = [];
                for (const log of rankingLogs) {
                    updates.push(
                        db.user.update({
                            where: { id: log.userId },
                            data: { elo: log.eloBefore },
                        })
                    );
                }

                await db.$transaction([
                    ...updates,
                    db.rankingLog.deleteMany({ where: { matchId: id } }),
                    db.game.deleteMany({ where: { matchId: id } }),
                    db.match.delete({ where: { id } }),
                ]);

                return NextResponse.json({ success: true, message: "Match deleted and ELO changes reversed" });
            }

            // First request - set deletionRequestedBy flag
            await db.match.update({
                where: { id },
                data: { deletionRequestedBy: session.user.id },
            });

            return NextResponse.json({
                success: true,
                message: "Deletion request sent. Waiting for opponent approval.",
                pendingDeletion: true
            });
        }

        return NextResponse.json({ error: "Cannot delete match with this status" }, { status: 400 });
    } catch (error) {
        console.error("[MATCH_DELETE]", error);
        return NextResponse.json({ error: "Failed to delete match" }, { status: 500 });
    }
}

