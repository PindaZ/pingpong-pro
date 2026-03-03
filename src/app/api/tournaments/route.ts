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

        // Check for admin/superadmin role
        const isSuperadmin = (session.user as any).globalRole === 'SUPERADMIN';
        if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN' && !isSuperadmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { name, startDate, endDate, maxParticipants } = await req.json();

        if (!name || !startDate || !endDate) {
            return new NextResponse("Missing data", { status: 400 });
        }

        let orgId = (session.user as any).activeOrganizationId;
        if (!orgId) {
            const member = await db.organizationMember.findFirst({
                where: { userId: session.user.id }
            });
            if (member) orgId = member.organizationId;
        }

        if (!orgId) {
            return new NextResponse("No active organization found", { status: 400 });
        }

        const tournament = await db.tournament.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                maxParticipants: maxParticipants ? parseInt(maxParticipants) : 32,
                creatorId: session.user.id,
                organizationId: orgId,
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
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const isSuperadmin = session.user.globalRole === 'SUPERADMIN';
        const orgId = (session.user as any).activeOrganizationId;

        const tournaments = await db.tournament.findMany({
            where: isSuperadmin ? {} : {
                organizationId: orgId
            },
            include: {
                creator: { select: { name: true } },
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
