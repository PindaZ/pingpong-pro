import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/tournaments/[id]/bracket/[matchId] - Log match result (user)
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string; matchId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: tournamentId, matchId } = await params;
        const { score1, score2 } = await req.json();

        const bracketMatch = await db.bracketMatch.findUnique({
            where: { id: matchId },
        });

        if (!bracketMatch || bracketMatch.tournamentId !== tournamentId) {
            return new NextResponse("Match not found", { status: 404 });
        }

        // Verify user is a participant
        const userId = session.user.id;
        if (bracketMatch.player1Id !== userId && bracketMatch.player2Id !== userId) {
            return new NextResponse("You are not a participant in this match", { status: 403 });
        }

        if (bracketMatch.status === "PLAYED") {
            return new NextResponse("Match already completed", { status: 400 });
        }

        // Determine winner based on scores (best of 3)
        const winnerId = score1 > score2 ? bracketMatch.player1Id : bracketMatch.player2Id;

        // Create pending match for validation (opponent must confirm)
        const match = await db.match.create({
            data: {
                player1Id: bracketMatch.player1Id!,
                player2Id: bracketMatch.player2Id!,
                tournamentId,
                status: "PENDING", // Always requires validation in tournaments
                games: {
                    create: [
                        { setNumber: 1, scorePlayer1: score1, scorePlayer2: score2 },
                    ],
                },
            },
        });

        // Update bracket match with pending scores (not confirmed yet)
        await db.bracketMatch.update({
            where: { id: matchId },
            data: {
                score1,
                score2,
                // Don't set winner until validated - status stays PENDING
            },
        });

        return NextResponse.json({ success: true, matchId: match.id, message: "Result logged. Awaiting opponent validation." });
    } catch (error) {
        console.error("[BRACKET_MATCH_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// PATCH /api/tournaments/[id]/bracket/[matchId] - Admin: set winner, replace player
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; matchId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check admin
        const user = await db.user.findUnique({ where: { id: session.user.id } });
        if (user?.role !== "ADMIN" && user?.role !== "SUPERADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { id: tournamentId, matchId } = await params;
        const body = await req.json();

        const bracketMatch = await db.bracketMatch.findUnique({
            where: { id: matchId },
        });

        if (!bracketMatch || bracketMatch.tournamentId !== tournamentId) {
            return new NextResponse("Match not found", { status: 404 });
        }

        // Handle different admin actions
        if (body.action === "setWinner") {
            const { winnerId, score1, score2 } = body;

            if (!winnerId) {
                return new NextResponse("Winner ID required", { status: 400 });
            }

            // Verify winner is a participant
            if (winnerId !== bracketMatch.player1Id && winnerId !== bracketMatch.player2Id) {
                return new NextResponse("Winner must be a participant", { status: 400 });
            }

            await db.bracketMatch.update({
                where: { id: matchId },
                data: {
                    winnerId,
                    score1: score1 ?? null,
                    score2: score2 ?? null,
                    status: "PLAYED",
                },
            });

            // Propagate winner to next round
            await propagateWinner(tournamentId, bracketMatch.round, bracketMatch.position, winnerId);

            return NextResponse.json({ success: true, message: "Winner set and propagated" });
        }

        if (body.action === "replacePlayer") {
            const { slot, newPlayerId } = body; // slot: "player1" or "player2"

            if (slot !== "player1" && slot !== "player2") {
                return new NextResponse("Invalid slot", { status: 400 });
            }

            // Verify new player is a tournament participant
            if (newPlayerId) {
                const participant = await db.tournamentParticipant.findFirst({
                    where: { tournamentId, userId: newPlayerId },
                });
                if (!participant) {
                    return new NextResponse("New player must be a tournament participant", { status: 400 });
                }
            }

            await db.bracketMatch.update({
                where: { id: matchId },
                data: slot === "player1" ? { player1Id: newPlayerId } : { player2Id: newPlayerId },
            });

            return NextResponse.json({ success: true, message: `${slot} updated` });
        }

        if (body.action === "removePlayer") {
            const { slot } = body;

            if (slot !== "player1" && slot !== "player2") {
                return new NextResponse("Invalid slot", { status: 400 });
            }

            // Remove player and auto-advance opponent
            const oppositeSlot = slot === "player1" ? "player2Id" : "player1Id";
            const opponentId = bracketMatch[oppositeSlot];

            await db.bracketMatch.update({
                where: { id: matchId },
                data: {
                    [slot === "player1" ? "player1Id" : "player2Id"]: null,
                    winnerId: opponentId,
                    status: "BYE",
                },
            });

            // Propagate if opponent exists
            if (opponentId) {
                await propagateWinner(tournamentId, bracketMatch.round, bracketMatch.position, opponentId);
            }

            return NextResponse.json({ success: true, message: `${slot} removed, opponent advanced` });
        }

        if (body.action === "reset") {
            await db.bracketMatch.update({
                where: { id: matchId },
                data: {
                    winnerId: null,
                    score1: null,
                    score2: null,
                    status: "PENDING",
                },
            });

            // Remove winner from next round
            await propagateWinner(tournamentId, bracketMatch.round, bracketMatch.position, null);

            return NextResponse.json({ success: true, message: "Match reset" });
        }

        return new NextResponse("Invalid action", { status: 400 });
    } catch (error) {
        console.error("[BRACKET_MATCH_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// Helper: Propagate winner (or removal) to next round
async function propagateWinner(tournamentId: string, round: number, position: number, winnerId: string | null) {
    const nextRound = round + 1;
    const nextPosition = Math.floor(position / 2);
    const isPlayer1 = position % 2 === 0;

    const nextMatch = await db.bracketMatch.findUnique({
        where: { tournamentId_round_position: { tournamentId, round: nextRound, position: nextPosition } },
    });

    if (nextMatch) {
        await db.bracketMatch.update({
            where: { id: nextMatch.id },
            data: isPlayer1 ? { player1Id: winnerId } : { player2Id: winnerId },
        });
    }
}
