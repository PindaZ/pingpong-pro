import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Join a tournament
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

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

// Admin: Add/remove a player from tournament
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check admin
        const user = await db.user.findUnique({ where: { id: session.user.id } });
        if (user?.role !== "ADMIN" && user?.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Only admins can manage participants" }, { status: 403 });
        }

        const { id } = await params;
        const { action, userId } = await req.json();

        if (!action || !userId) {
            return NextResponse.json({ error: "Action and userId are required" }, { status: 400 });
        }

        const tournament = await db.tournament.findUnique({
            where: { id },
            include: { _count: { select: { participants: true } } },
        });

        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        if (tournament.bracketGenerated) {
            return NextResponse.json({ error: "Cannot modify participants after bracket is generated" }, { status: 400 });
        }

        if (action === "add") {
            // Check if tournament is full
            if (tournament._count.participants >= tournament.maxParticipants) {
                return NextResponse.json({ error: "Tournament is full" }, { status: 400 });
            }

            // Check if user exists
            const targetUser = await db.user.findUnique({ where: { id: userId } });
            if (!targetUser) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            // Check if already joined
            const existing = await db.tournamentParticipant.findUnique({
                where: { tournamentId_userId: { tournamentId: id, userId } },
            });
            if (existing) {
                return NextResponse.json({ error: "User already in tournament" }, { status: 400 });
            }

            await db.tournamentParticipant.create({
                data: { tournamentId: id, userId },
            });

            return NextResponse.json({ success: true, message: "Player added" });
        }

        if (action === "remove") {
            await db.tournamentParticipant.delete({
                where: { tournamentId_userId: { tournamentId: id, userId } },
            });

            return NextResponse.json({ success: true, message: "Player removed" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("[TOURNAMENT_MANAGE]", error);
        return NextResponse.json({ error: "Failed to manage participants" }, { status: 500 });
    }
}
