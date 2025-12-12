import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/tournaments/[id]/bracket - Fetch bracket data
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const tournament = await db.tournament.findUnique({
            where: { id },
            include: {
                bracketMatches: {
                    include: {
                        player1: { select: { id: true, name: true, avatarUrl: true, elo: true } },
                        player2: { select: { id: true, name: true, avatarUrl: true, elo: true } },
                        winner: { select: { id: true, name: true } },
                    },
                    orderBy: [{ round: "asc" }, { position: "asc" }],
                },
                participants: {
                    include: {
                        user: { select: { id: true, name: true, elo: true } },
                    },
                },
            },
        });

        if (!tournament) {
            return new NextResponse("Tournament not found", { status: 404 });
        }

        return NextResponse.json(tournament);
    } catch (error) {
        console.error("[BRACKET_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/tournaments/[id]/bracket - Generate bracket
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { seedingType } = await req.json();

        // Check admin
        const user = await db.user.findUnique({ where: { id: session.user.id } });
        if (user?.role !== "ADMIN" && user?.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Only admins can generate brackets" }, { status: 403 });
        }

        // Get tournament with participants
        const tournament = await db.tournament.findUnique({
            where: { id },
            include: {
                participants: {
                    include: { user: { select: { id: true, elo: true } } },
                },
            },
        });

        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        if (tournament.bracketGenerated) {
            return NextResponse.json({ error: "Bracket already generated" }, { status: 400 });
        }

        if (tournament.participants.length < 2) {
            return NextResponse.json({ error: "Need at least 2 participants to generate a bracket" }, { status: 400 });
        }

        // Get participants and sort/shuffle based on seeding type
        let participants = [...tournament.participants];

        if (seedingType === "ELO") {
            // Sort by ELO descending (highest first)
            participants.sort((a, b) => b.user.elo - a.user.elo);
        } else {
            // Fisher-Yates shuffle for random
            for (let i = participants.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [participants[i], participants[j]] = [participants[j], participants[i]];
            }
        }

        // Calculate bracket size (next power of 2)
        const numParticipants = participants.length;
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(numParticipants)));
        const numRounds = Math.log2(bracketSize);
        const numByes = bracketSize - numParticipants;

        // Create first round matches
        const bracketMatches = [];
        const firstRoundMatches = bracketSize / 2;

        // For ELO seeding, pair 1v16, 2v15, etc.
        // For random, just pair sequentially after shuffle
        for (let pos = 0; pos < firstRoundMatches; pos++) {
            let p1Index: number, p2Index: number;

            if (seedingType === "ELO") {
                // Standard tournament seeding: 1v16, 8v9, 5v12, 4v13, etc.
                p1Index = pos;
                p2Index = bracketSize - 1 - pos;
            } else {
                p1Index = pos * 2;
                p2Index = pos * 2 + 1;
            }

            const player1 = p1Index < numParticipants ? participants[p1Index] : null;
            const player2 = p2Index < numParticipants ? participants[p2Index] : null;

            const isBye = !player1 || !player2;
            const byeWinner = isBye ? (player1 ? player1.userId : player2?.userId) : null;

            bracketMatches.push({
                tournamentId: id,
                round: 1,
                position: pos,
                player1Id: player1?.userId || null,
                player2Id: player2?.userId || null,
                status: isBye ? "BYE" : "PENDING",
                winnerId: byeWinner,
            });
        }

        // Create empty matches for subsequent rounds
        for (let round = 2; round <= numRounds; round++) {
            const matchesInRound = bracketSize / Math.pow(2, round);
            for (let pos = 0; pos < matchesInRound; pos++) {
                bracketMatches.push({
                    tournamentId: id,
                    round,
                    position: pos,
                    player1Id: null,
                    player2Id: null,
                    status: "PENDING",
                    winnerId: null,
                });
            }
        }

        // Create all bracket matches and update tournament
        await db.$transaction([
            db.bracketMatch.createMany({ data: bracketMatches }),
            db.tournament.update({
                where: { id },
                data: { bracketGenerated: true, seedingType: seedingType || "RANDOM" },
            }),
            // Update participant seeds
            ...participants.map((p, idx) =>
                db.tournamentParticipant.update({
                    where: { id: p.id },
                    data: { seed: idx + 1 },
                })
            ),
        ]);

        // Propagate bye winners to next round
        const createdMatches = await db.bracketMatch.findMany({
            where: { tournamentId: id, round: 1, status: "BYE" },
        });

        for (const match of createdMatches) {
            if (match.winnerId) {
                await propagateWinner(id, match.round, match.position, match.winnerId);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[BRACKET_POST]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Helper: Propagate winner to next round
async function propagateWinner(tournamentId: string, round: number, position: number, winnerId: string) {
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
