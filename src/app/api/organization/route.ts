import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const orgId = (session.user as any).activeOrganizationId;
        if (!orgId) {
            return new NextResponse("No active organization", { status: 400 });
        }

        const organization = await db.organization.findUnique({
            where: { id: orgId },
            include: {
                _count: {
                    select: { members: true }
                }
            }
        });

        if (!organization) {
            return new NextResponse("Organization not found", { status: 404 });
        }

        return NextResponse.json(organization);
    } catch (error) {
        console.error("[ORGANIZATION_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
