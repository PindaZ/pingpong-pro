import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// One-time migration endpoint - call this after deployment
// GET /api/setup to run migrations
export async function GET() {
    try {
        // Check for a secret to prevent unauthorized access
        // In production, you should use a proper secret

        console.log("[SETUP] Running database migrations...");

        // Try to run prisma migrate deploy
        const { stdout, stderr } = await execAsync(
            "node node_modules/prisma/build/index.js migrate deploy",
            { cwd: process.cwd() }
        );

        console.log("[SETUP] Migration output:", stdout);
        if (stderr) console.log("[SETUP] Migration stderr:", stderr);

        return NextResponse.json({
            success: true,
            message: "Migrations completed successfully",
            output: stdout
        });
    } catch (error: any) {
        console.error("[SETUP] Migration failed:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stderr: error.stderr
        }, { status: 500 });
    }
}
