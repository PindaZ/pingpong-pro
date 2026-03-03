import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return new NextResponse("Missing data", { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user || !user.password) {
            return new NextResponse("User not found", { status: 404 });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return new NextResponse("Incorrect current password", { status: 401 });
        }

        if (newPassword.length < 6) {
            return new NextResponse("New password must be at least 6 characters", { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[PROFILE_PASSWORD_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
