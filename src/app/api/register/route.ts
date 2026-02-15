import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { name, email, password, organizationCode } = await req.json();

        if (!email || !name || !password || !organizationCode) {
            return new NextResponse("Missing data", { status: 400 });
        }

        // Validate organization code
        const organization = await db.organization.findUnique({
            where: { inviteCode: organizationCode.toUpperCase() },
            include: {
                members: true,
            },
        });

        if (!organization) {
            return new NextResponse("Invalid organization code", { status: 400 });
        }

        const userExists = await db.user.findUnique({
            where: { email },
        });

        if (userExists) {
            return new NextResponse("User already exists", { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user and organization membership in a transaction
        const user = await db.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    // Global role defaults to USER
                    role: "USER",
                },
            });

            // First member of the org becomes ADMIN
            const isFirstMember = organization.members.length === 0;

            await tx.organizationMember.create({
                data: {
                    userId: newUser.id,
                    organizationId: organization.id,
                    role: isFirstMember ? "ADMIN" : "USER",
                    elo: 1200,
                },
            });

            return newUser;
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
