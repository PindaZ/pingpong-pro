
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query || query.length < 2) {
            return NextResponse.json([]);
        }

        const users = await db.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                ],
            },
            take: 10,
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("[USERS_SEARCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
