import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
    try {
        const hashedPassword = await bcrypt.hash("password123", 10);

        const user = await db.user.upsert({
            where: { email: "mock@example.com" },
            update: {},
            create: {
                email: "mock@example.com",
                name: "Mock User",
                password: hashedPassword,
                role: "USER"
            }
        });

        return NextResponse.json({
            message: "Mock user created/verified",
            email: "mock@example.com",
            password: "password123"
        });
    } catch (error) {
        console.error("Seed failed:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
