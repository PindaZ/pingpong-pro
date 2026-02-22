import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MatchesClient from "./MatchesClient";

export default async function MatchesPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const user = await db.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user) redirect("/login");

    const matches = await db.match.findMany({
        orderBy: { playedAt: 'desc' },
        include: {
            player1: true,
            player2: true,
            winner: true,
            games: true,
        }
    });

    const users = await db.user.findMany({
        select: { id: true, name: true, email: true }
    });

    return (
        <MatchesClient
            matches={matches}
            users={users}
            currentUserId={session.user.id}
        />
    );
}

