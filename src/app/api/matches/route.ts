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

        const { opponentId, scores, tournamentId } = await req.json(); // scores: [{p1: 11, p2: 5}, ...]

        if (!opponentId || !scores || !Array.isArray(scores)) {
            return new NextResponse("Missing data", { status: 400 });
        }

        const match = await db.match.create({
            data: {
                player1Id: session.user.id,
                player2Id: opponentId as string,
                status: "PENDING",
                tournamentId: tournamentId || null,
                games: {
                    create: scores.map((s: any, i: number) => ({
                        setNumber: i + 1,
                        scorePlayer1: parseInt(s.p1),
                        scorePlayer2: parseInt(s.p2),
                    }))
                }
            },
        });

        return NextResponse.json(match);
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
                date: 'desc'
            }
        });

        return NextResponse.json(matches);
    } catch (error) {
        console.error("[MATCHES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
