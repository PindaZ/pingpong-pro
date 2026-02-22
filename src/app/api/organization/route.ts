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

        const isSuperadmin = session.user.globalRole === 'SUPERADMIN';
        const orgId = (session.user as any).activeOrganizationId;
        
        if (!orgId && !isSuperadmin) {
            return new NextResponse("No active organization", { status: 400 });
        }

        // If Superadmin and no orgId in session, maybe they want a list? 
        // For this specific route, we usually expect a single org.
        
        const organization = await db.organization.findUnique({
            where: { id: orgId || 'unknown' },
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
