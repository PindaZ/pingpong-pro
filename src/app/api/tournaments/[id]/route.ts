import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Join a tournament
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        // Get tournament
        const tournament = await db.tournament.findUnique({
            where: { id },
            include: { _count: { select: { participants: true } } },
        });

        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        // Check if tournament is full
        if (tournament._count.participants >= tournament.maxParticipants) {
            return NextResponse.json({ error: "Tournament is full" }, { status: 400 });
        }

        // Check if already joined
        const existingParticipant = await db.tournamentParticipant.findUnique({
            where: {
                tournamentId_userId: {
                    tournamentId: id,
                    userId: session.user.id,
                },
            },
        });

        if (existingParticipant) {
            return NextResponse.json({ error: "Already joined this tournament" }, { status: 400 });
        }

        // Join tournament
        await db.tournamentParticipant.create({
            data: {
                tournamentId: id,
                userId: session.user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[TOURNAMENT_JOIN]", error);
        return NextResponse.json({ error: "Failed to join tournament" }, { status: 500 });
    }
}

// Leave a tournament
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        await db.tournamentParticipant.delete({
            where: {
                tournamentId_userId: {
                    tournamentId: id,
                    userId: session.user.id,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[TOURNAMENT_LEAVE]", error);
        return NextResponse.json({ error: "Failed to leave tournament" }, { status: 500 });
    }
}
