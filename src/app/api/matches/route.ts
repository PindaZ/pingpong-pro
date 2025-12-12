import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { opponentId, scores, tournamentId, skipValidation } = await req.json(); // scores: [{p1: 11, p2: 5}, ...]

        if (!opponentId || !scores || !Array.isArray(scores)) {
            return new NextResponse("Missing data", { status: 400 });
        }

        // Calculate scores to determine winner
        let player1Wins = 0;
        let player2Wins = 0;
        const formattedGames = scores.map((s: any, i: number) => {
            const s1 = parseInt(s.p1);
            const s2 = parseInt(s.p2);
            if (s1 > s2) player1Wins++; else player2Wins++;
            return {
                setNumber: i + 1,
                scorePlayer1: s1,
                scorePlayer2: s2,
            };
        });

        const winnerId = player1Wins > player2Wins ? session.user.id : opponentId;

        if (!skipValidation) {
            // Standard flow: Create pending match
            const match = await db.match.create({
                data: {
                    player1Id: session.user.id,
                    player2Id: opponentId as string,
                    status: "PENDING",
                    tournamentId: tournamentId || null,
                    games: { create: formattedGames }
                },
            });
            return NextResponse.json(match);
        } else {
            // Auto-validation flow
            // 1. Get current ELOs
            const player1 = await db.user.findUnique({ where: { id: session.user.id } });
            const player2 = await db.user.findUnique({ where: { id: opponentId } });

            if (!player1 || !player2) return new NextResponse("Players not found", { status: 404 });

            // 2. Calculate ELO change
            const K = 32;
            const p1Elo = player1.elo;
            const p2Elo = player2.elo;
            const expectedP1 = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
            const expectedP2 = 1 - expectedP1;
            const actualP1 = player1Wins > player2Wins ? 1 : 0;
            const actualP2 = actualP1 === 1 ? 0 : 1;

            const newP1Elo = Math.round(p1Elo + K * (actualP1 - expectedP1));
            const newP2Elo = Math.round(p2Elo + K * (actualP2 - expectedP2));

            // 3. Transaction
            const result = await db.$transaction(async (tx) => {
                const match = await tx.match.create({
                    data: {
                        player1Id: session.user.id,
                        player2Id: opponentId as string,
                        status: "VALIDATED",
                        winnerId,
                        tournamentId: tournamentId || null,
                        games: { create: formattedGames }
                    },
                });

                await tx.user.update({ where: { id: player1.id }, data: { elo: newP1Elo } });
                await tx.user.update({ where: { id: player2.id }, data: { elo: newP2Elo } });

                await tx.rankingLog.createMany({
                    data: [
                        { userId: player1.id, matchId: match.id, eloBefore: p1Elo, eloAfter: newP1Elo, change: newP1Elo - p1Elo },
                        { userId: player2.id, matchId: match.id, eloBefore: p2Elo, eloAfter: newP2Elo, change: newP2Elo - p2Elo }
                    ]
                });

                return match;
            });

            return NextResponse.json(result);
        }
    } catch (error) {
        console.error("[MATCHES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');

        let whereClause: any = {};

        if (userId) {
            whereClause.OR = [
                { player1Id: userId },
                { player2Id: userId }
            ];
        }

        if (status) {
            whereClause.status = status;
        }

        const matches = await db.match.findMany({
            where: whereClause,
            include: {
                player1: { select: { id: true, name: true, avatarUrl: true } },
                player2: { select: { id: true, name: true, avatarUrl: true } },
                games: true,
                winner: { select: { id: true, name: true } }
            },
            orderBy: {
                playedAt: 'desc'
            }
        });

        return NextResponse.json(matches);
    } catch (error) {
        console.error("[MATCHES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
