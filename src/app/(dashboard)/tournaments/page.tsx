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

    const tournaments = await db.tournament.findMany({
        orderBy: { startDate: 'desc' },
        include: {
            creator: true,
            _count: {
                select: { participants: true }
            }
        }
    });

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

    return (
        <TournamentsClient
            tournaments={tournaments}
            currentUserId={session.user.id}
            isAdmin={isAdmin}
        />
    );
}

