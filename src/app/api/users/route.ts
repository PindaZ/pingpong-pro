import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const users = await db.user.findMany({
            where: {
                memberships: {
                    some: {
                        organizationId: (session.user as any).activeOrganizationId
                    }
                }
            },
            orderBy: {
                elo: 'desc',
            },
            select: {
                id: true,
                name: true,
                elo: true,
                avatarUrl: true,
                role: true,
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("[USERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
