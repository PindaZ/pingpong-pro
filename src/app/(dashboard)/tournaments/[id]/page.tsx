import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import TournamentDetailClient from "./TournamentDetailClient";

export default async function TournamentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { id } = await params;

    const tournament = await db.tournament.findUnique({
        where: { id },
        include: {
            creator: { select: { id: true, name: true } },
            participants: {
                include: {
                    user: { select: { id: true, name: true, avatarUrl: true, elo: true } },
                },
                orderBy: { seed: "asc" },
            },
            bracketMatches: {
                include: {
                    player1: { select: { id: true, name: true, avatarUrl: true, elo: true } },
                    player2: { select: { id: true, name: true, avatarUrl: true, elo: true } },
                    winner: { select: { id: true, name: true } },
                },
                orderBy: [{ round: "asc" }, { position: "asc" }],
            },
        },
    });

    if (!tournament) notFound();

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user) redirect("/login");
    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

    // Serialize dates
    const serializedTournament = {
        ...tournament,
        startDate: tournament.startDate.toISOString(),
        endDate: tournament.endDate.toISOString(),
        createdAt: tournament.createdAt.toISOString(),
        updatedAt: tournament.updatedAt.toISOString(),
        participants: tournament.participants.map((p) => ({
            ...p,
            joinedAt: p.joinedAt.toISOString(),
        })),
        bracketMatches: tournament.bracketMatches.map((m) => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
            updatedAt: m.updatedAt.toISOString(),
        })),
    };

    return (
        <TournamentDetailClient
            tournament={serializedTournament}
            currentUserId={session.user.id}
            isAdmin={isAdmin}
        />
    );
}
