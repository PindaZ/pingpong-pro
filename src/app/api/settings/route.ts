import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Fetch user settings
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get or create settings for user
        let settings = await db.userSettings.findUnique({
            where: { userId: session.user.id },
        });

        if (!settings) {
            // Create default settings
            settings = await db.userSettings.create({
                data: {
                    userId: session.user.id,
                    primaryColor: "#6366f1",
                    secondaryColor: "#8b5cf6",
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("[SETTINGS_GET]", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

// PATCH - Update user settings (ADMIN/SUPERADMIN only)
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin or superadmin
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { primaryColor, secondaryColor } = body;

        // Validate color format (hex)
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        if (primaryColor && !hexRegex.test(primaryColor)) {
            return NextResponse.json({ error: "Invalid primary color format" }, { status: 400 });
        }
        if (secondaryColor && !hexRegex.test(secondaryColor)) {
            return NextResponse.json({ error: "Invalid secondary color format" }, { status: 400 });
        }

        // Upsert settings
        const settings = await db.userSettings.upsert({
            where: { userId: session.user.id },
            update: {
                primaryColor: primaryColor || undefined,
                secondaryColor: secondaryColor || undefined,
            },
            create: {
                userId: session.user.id,
                primaryColor: primaryColor || "#6366f1",
                secondaryColor: secondaryColor || "#8b5cf6",
            },
        });

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error("[SETTINGS_PATCH]", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
