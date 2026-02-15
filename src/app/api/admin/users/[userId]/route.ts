import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export async function PATCH(
    req: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Only ADMIN and SUPERADMIN can access this endpoint
        const currentUser = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!currentUser || (currentUser.role !== Role.ADMIN && currentUser.role !== Role.SUPERADMIN)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { role } = await req.json();

        if (!Object.values(Role).includes(role)) {
            return new NextResponse("Invalid Role", { status: 400 });
        }

        // Target user
        const targetUser = await db.user.findUnique({
            where: { id: params.userId },
        });

        if (!targetUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Restrictions:
        // 1. Cannot change a SUPERADMIN's role
        if (targetUser.role === Role.SUPERADMIN) {
            return new NextResponse("Cannot modify SUPERADMIN", { status: 403 });
        }

        // 2. Only SUPERADMIN can promote someone to ADMIN
        if (role === Role.ADMIN && currentUser.role !== Role.SUPERADMIN) {
            return new NextResponse("Only SUPERADMIN can promote users to ADMIN", { status: 403 });
        }

        // 3. Prevent creating new SUPERADMINS via API
        if (role === Role.SUPERADMIN) {
            return new NextResponse("Cannot assign SUPERADMIN role", { status: 403 });
        }

        const updatedUser = await db.user.update({
            where: { id: params.userId },
            data: { role },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("[USER_ROLE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { userId: string } }
) {
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

        const targetUser = await db.user.findUnique({
            where: { id: params.userId },
        });

        if (!targetUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Restrictions:
        // 1. Cannot delete a SUPERADMIN
        if (targetUser.role === Role.SUPERADMIN) {
            return new NextResponse("Cannot delete SUPERADMIN", { status: 403 });
        }

        // 2. Regular ADMIN cannot delete other ADMINS
        if (targetUser.role === Role.ADMIN && currentUser.role !== Role.SUPERADMIN) {
            return new NextResponse("Only SUPERADMIN can delete ADMINS", { status: 403 });
        }

        await db.user.delete({
            where: { id: params.userId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[USER_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
