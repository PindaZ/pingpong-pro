import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// DANGER: Admin-only endpoint to clean up test users
// DELETE /api/admin/cleanup-users?keepEmail=jeroendekker635@gmail.com
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the email to keep from query params
        const url = new URL(req.url);
        const keepEmail = url.searchParams.get("keepEmail");

        if (!keepEmail) {
            return NextResponse.json({ error: "Missing keepEmail parameter" }, { status: 400 });
        }

        // Find the user to keep
        const keepUser = await db.user.findUnique({
            where: { email: keepEmail }
        });

        if (!keepUser) {
            return NextResponse.json({ error: `User with email ${keepEmail} not found` }, { status: 404 });
        }

        console.log(`[CLEANUP] Keeping user: ${keepUser.id} (${keepEmail})`);

        // Get all user IDs to delete
        const usersToDelete = await db.user.findMany({
            where: { email: { not: keepEmail } },
            select: { id: true, email: true }
        });

        console.log(`[CLEANUP] Users to delete: ${usersToDelete.length}`);

        if (usersToDelete.length === 0) {
            return NextResponse.json({ message: "No users to delete", kept: keepUser.id });
        }

        const deleteIds = usersToDelete.map(u => u.id);

        // Delete in correct order to avoid FK violations
        // 1. Delete bracket matches where deleted users are participants
        const bracketDeleted = await db.bracketMatch.deleteMany({
            where: {
                OR: [
                    { player1Id: { in: deleteIds } },
                    { player2Id: { in: deleteIds } },
                    { winnerId: { in: deleteIds } }
                ]
            }
        });
        console.log(`[CLEANUP] Deleted ${bracketDeleted.count} bracket matches`);

        // 2. Delete tournament participants
        const participantsDeleted = await db.tournamentParticipant.deleteMany({
            where: { userId: { in: deleteIds } }
        });
        console.log(`[CLEANUP] Deleted ${participantsDeleted.count} tournament participants`);

        // 3. Delete ranking logs
        const logsDeleted = await db.rankingLog.deleteMany({
            where: { userId: { in: deleteIds } }
        });
        console.log(`[CLEANUP] Deleted ${logsDeleted.count} ranking logs`);

        // 4. Find matches involving deleted users
        const matchesToDelete = await db.match.findMany({
            where: {
                OR: [
                    { player1Id: { in: deleteIds } },
                    { player2Id: { in: deleteIds } }
                ]
            },
            select: { id: true }
        });
        const matchIds = matchesToDelete.map(m => m.id);

        // 5. Delete games from those matches
        const gamesDeleted = await db.game.deleteMany({
            where: { matchId: { in: matchIds } }
        });
        console.log(`[CLEANUP] Deleted ${gamesDeleted.count} games`);

        // 6. Delete matches
        const matchesDeleted = await db.match.deleteMany({
            where: { id: { in: matchIds } }
        });
        console.log(`[CLEANUP] Deleted ${matchesDeleted.count} matches`);

        // 7. Delete tournaments created by deleted users
        const tournamentsDeleted = await db.tournament.deleteMany({
            where: { creatorId: { in: deleteIds } }
        });
        console.log(`[CLEANUP] Deleted ${tournamentsDeleted.count} tournaments`);

        // 8. Finally delete the users
        const usersDeleted = await db.user.deleteMany({
            where: { id: { in: deleteIds } }
        });
        console.log(`[CLEANUP] Deleted ${usersDeleted.count} users`);

        return NextResponse.json({
            success: true,
            message: `Cleanup complete. Kept user: ${keepEmail}`,
            deleted: {
                users: usersDeleted.count,
                matches: matchesDeleted.count,
                games: gamesDeleted.count,
                tournaments: tournamentsDeleted.count,
                bracketMatches: bracketDeleted.count,
                participants: participantsDeleted.count,
                rankingLogs: logsDeleted.count
            }
        });

    } catch (error: any) {
        console.error("[CLEANUP] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
