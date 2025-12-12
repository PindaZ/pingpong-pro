import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !name || !password) {
            return new NextResponse("Missing data", { status: 400 });
        }

        const userExists = await db.user.findUnique({
            where: { email },
        });

        if (userExists) {
            return new NextResponse("User already exists", { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                // First user defaults to SUPERADMIN, otherwise USER
                role: (await db.user.count()) === 0 ? "SUPERADMIN" : "USER",
            },
        });

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        });

    } catch (error) {
        console.error("[REGISTER_ERROR]", error);
        
        // Enhanced error logging for debugging
        if (error instanceof Error) {
            console.error("[REGISTER_ERROR] Error name:", error.name);
            console.error("[REGISTER_ERROR] Error message:", error.message);
            console.error("[REGISTER_ERROR] Stack trace:", error.stack);
        }
        
        // Check for specific Prisma errors
        if (error && typeof error === 'object' && 'code' in error) {
            console.error("[REGISTER_ERROR] Prisma error code:", (error as any).code);
            console.error("[REGISTER_ERROR] Prisma meta:", (error as any).meta);
        }
        
        return new NextResponse("Internal Error", { status: 500 });
    }
}
