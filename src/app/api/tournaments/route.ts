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

        // Optional: Check for admin role
        // if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
        //   return new NextResponse("Forbidden", { status: 403 });
        // }

        const { name, startDate, endDate } = await req.json();

        if (!name || !startDate || !endDate) {
            return new NextResponse("Missing data", { status: 400 });
        }

        const tournament = await db.tournament.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                creatorId: session.user.id,
                status: "UPCOMING"
            },
        });

        return NextResponse.json(tournament);
    } catch (error) {
        console.error("[TOURNAMENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const tournaments = await db.tournament.findMany({
            include: {
                creator: { select: { name: true } },
                winner: { select: { name: true, avatarUrl: true } },
                _count: {
                    select: { participants: true }
                }
            },
            orderBy: {
                startDate: 'desc'
            }
        });

        return NextResponse.json(tournaments);
    } catch (error) {
        console.error("[TOURNAMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
