import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, bio, avatarUrl } = body;

        const updatedUser = await db.user.update({
            where: { id: session.user.id },
            data: {
                name: name !== undefined ? name : undefined,
                bio: bio !== undefined ? bio : undefined,
                avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
            },
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("[PROFILE_UPDATE]", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
