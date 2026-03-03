import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateElo } from "@/lib/elo";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { opponentId, games, tournamentId, skipValidation, isFriendlyMatch } = await req.json();

        if (!opponentId || !games || !Array.isArray(games) || games.length === 0) {
            return new NextResponse("Missing data", { status: 400 });
        }

        // Validate ITTF rules and Match Completion
        let player1Wins = 0;
        let player2Wins = 0;

        for (let i = 0; i < games.length; i++) {
            const s = games[i];
            const p1 = parseInt(s.p1);
            const p2 = parseInt(s.p2);

            if (isNaN(p1) || isNaN(p2)) return new NextResponse(`Invalid score in game ${i + 1}`, { status: 400 });

            const winner = Math.max(p1, p2);
            const loser = Math.min(p1, p2);

            if (winner - loser < 2) return new NextResponse(`Game ${i + 1}: Winner must lead by at least 2 points.`, { status: 400 });
            if (loser <= 9 && winner !== 11) return new NextResponse(`Game ${i + 1}: Winner must reach exactly 11 points if opponent has 9 or less.`, { status: 400 });
            if (loser >= 10 && winner - loser !== 2) return new NextResponse(`Game ${i + 1}: In deuce, winner must win by exactly 2 points.`, { status: 400 });

            if (p1 > p2) player1Wins++; else player2Wins++;
        }

        const requiredWins = (games.length > 3 || Math.max(player1Wins, player2Wins) >= 3 || (player1Wins === 2 && player2Wins === 2)) ? 3 : 2;
        if (player1Wins < requiredWins && player2Wins < requiredWins) {
            return new NextResponse(`Match is incomplete. Format of Best of ${requiredWins * 2 - 1} required.`, { status: 400 });
        }

        // Check for extra games played
        let runningP1 = 0;
        let runningP2 = 0;
        let hasExtraGames = false;
        for (let i = 0; i < games.length; i++) {
            const p1 = parseInt(games[i].p1);
            const p2 = parseInt(games[i].p2);
            if (p1 > p2) runningP1++; else runningP2++;
            if ((runningP1 >= requiredWins || runningP2 >= requiredWins) && i < games.length - 1) {
                hasExtraGames = true;
                break;
            }
        }

        if (hasExtraGames) {
            return new NextResponse("Invalid format: Games were played after a match winner was already decided.", { status: 400 });
        }

        const formattedGames = games.map((s: any, i: number) => {
            return {
                setNumber: i + 1,
                scorePlayer1: parseInt(s.p1),
                scorePlayer2: parseInt(s.p2),
            };
        });

        const winnerId = player1Wins > player2Wins ? session.user.id : opponentId;

        // Friendly match: No ELO impact, auto-validated, marked as not validated
        if (isFriendlyMatch) {
            const match = await db.match.create({
                data: {
                    player1Id: session.user.id,
                    player2Id: opponentId as string,
                    status: "VALIDATED", // No need for approval
                    winnerId,
                    isValidated: false, // Mark as friendly (no ELO impact)
                    tournamentId: tournamentId || null,
                    organizationId: (session.user as any).activeOrganizationId,
                    games: { create: formattedGames }
                },
            });
            return NextResponse.json(match);
        }

        if (!skipValidation) {
            // Standard flow: Create pending match
            const match = await db.match.create({
                data: {
                    player1Id: session.user.id,
                    player2Id: opponentId as string,
                    status: "PENDING",
                    tournamentId: tournamentId || null,
                    organizationId: (session.user as any).activeOrganizationId,
                    games: { create: formattedGames }
                },
            });
            return NextResponse.json(match);
        } else {
            // Auto-validation flow with ELO update
            // 1. Get current ELOs
            const player1 = await db.user.findUnique({ where: { id: session.user.id } });
            const player2 = await db.user.findUnique({ where: { id: opponentId } });

            if (!player1 || !player2) return new NextResponse("Players not found", { status: 404 });

            // 2. Calculate ELO change
            const gamesForElo = formattedGames.map((g: any) => ({
                scoreWinner: player1Wins > player2Wins ? g.scorePlayer1 : g.scorePlayer2,
                scoreLoser: player1Wins > player2Wins ? g.scorePlayer2 : g.scorePlayer1,
            }));

            const winnerElo = player1Wins > player2Wins ? player1.elo : player2.elo;
            const loserElo = player1Wins > player2Wins ? player2.elo : player1.elo;

            const { eloChange } = calculateElo(winnerElo, loserElo, gamesForElo);

            const newP1Elo = player1.elo + (player1Wins > player2Wins ? eloChange : -eloChange);
            const newP2Elo = player2.elo + (player2Wins > player1Wins ? eloChange : -eloChange);

            // 3. Transaction
            const result = await db.$transaction(async (tx) => {
                const match = await tx.match.create({
                    data: {
                        player1Id: session.user.id,
                        player2Id: opponentId as string,
                        status: "VALIDATED",
                        winnerId,
                        isValidated: true, // Ranked match
                        tournamentId: tournamentId || null,
                        organizationId: (session.user as any).activeOrganizationId,
                        games: { create: formattedGames }
                    },
                });

                await tx.user.update({ where: { id: player1.id }, data: { elo: newP1Elo } });
                await tx.user.update({ where: { id: player2.id }, data: { elo: newP2Elo } });

                await tx.rankingLog.createMany({
                    data: [
                        { userId: player1.id, matchId: match.id, eloBefore: player1.elo, eloAfter: newP1Elo, change: newP1Elo - player1.elo, organizationId: (session.user as any).activeOrganizationId },
                        { userId: player2.id, matchId: match.id, eloBefore: player2.elo, eloAfter: newP2Elo, change: newP2Elo - player2.elo, organizationId: (session.user as any).activeOrganizationId }
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
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');

        let whereClause: any = {
            organizationId: (session.user as any).activeOrganizationId
        };

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
