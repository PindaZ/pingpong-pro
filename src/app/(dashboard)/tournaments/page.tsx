import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TournamentsClient from "./TournamentsClient";

export default async function TournamentsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const user = await db.user.findUnique({
        where: { id: session.user.id },
    });

    const tournamentsData = await db.tournament.findMany({
        orderBy: { startDate: 'desc' },
        include: {
            _count: {
                select: { participants: true }
            },
            participants: {
                select: {
                    userId: true,
                    seed: true
                }
            }
        }
    });

    // Serialize dates to strings to avoid passing Date objects directly to Client Component
    // although Next.js supports it, it can be a source of issues.
    const tournaments = tournamentsData.map(t => ({
        id: t.id,
        name: t.name,
        startDate: t.startDate.toISOString(),
        endDate: t.endDate.toISOString(),
        status: "UPCOMING", // Pre-fill status key to avoid spread issues later, though calculated in client
        maxParticipants: t.maxParticipants,
        participantsCount: t._count?.participants ?? 0, // Flatten count defensively
        creatorId: t.creatorId,
    }));

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

    return (
        <TournamentsClient
            tournaments={tournaments}
            currentUserId={session.user.id}
            isAdmin={isAdmin}
        />
    );
}

