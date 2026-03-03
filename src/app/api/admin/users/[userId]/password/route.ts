import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const currentUser = await db.user.findUnique({
            where: { id: session.user.id },
        });

        const isSuperadmin = (session.user as any).globalRole === 'SUPERADMIN';

        if (!currentUser || (currentUser.role !== Role.ADMIN && currentUser.role !== Role.SUPERADMIN && !isSuperadmin)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const targetUser = await db.user.findUnique({
            where: { id: userId },
        });

        if (!targetUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Restrictions
        if (targetUser.role === Role.SUPERADMIN) {
            return new NextResponse("Cannot modify SUPERADMIN", { status: 403 });
        }
        if (targetUser.role === Role.ADMIN && currentUser.role !== Role.SUPERADMIN && !isSuperadmin) {
            return new NextResponse("Only SUPERADMIN can modify ADMINS", { status: 403 });
        }

        const { newPassword } = await req.json();

        if (!newPassword || newPassword.length < 6) {
            return new NextResponse("Password must be at least 6 characters", { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[USER_PASSWORD_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
