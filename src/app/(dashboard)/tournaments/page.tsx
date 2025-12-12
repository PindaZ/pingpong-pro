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
            }
        }
    });

    // Serialize dates to strings to avoid passing Date objects directly to Client Component
    // although Next.js supports it, it can be a source of issues.
    const tournaments = tournamentsData.map(t => ({
        ...t,
        startDate: t.startDate.toISOString(),
        endDate: t.endDate.toISOString(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
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

