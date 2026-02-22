import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const currentUser = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!currentUser || (currentUser.role !== Role.ADMIN && currentUser.role !== Role.SUPERADMIN)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const isSuperadmin = session.user.globalRole === Role.SUPERADMIN;
        const orgId = (session.user as any).activeOrganizationId;

        const users = await db.user.findMany({
            where: isSuperadmin ? {} : {
                memberships: {
                    some: {
                        organizationId: orgId
                    }
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("[ADMIN_USERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
