import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const users = await db.user.findMany({
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
