import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir, access } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file received" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;

        // Use /app/public/uploads in production (Docker) or cwd/public/uploads locally
        const isDocker = process.env.NODE_ENV === "production";
        const uploadDir = isDocker
            ? "/app/public/uploads"
            : path.join(process.cwd(), "public/uploads");

        console.log("[UPLOAD] Saving to:", uploadDir);
        console.log("[UPLOAD] Filename:", filename);

        // Create directory if it doesn't exist
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (mkdirError: any) {
            if (mkdirError.code !== 'EEXIST') {
                console.error("[UPLOAD] mkdir error:", mkdirError);
            }
        }

        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        console.log("[UPLOAD] File saved successfully:", filePath);

        const url = `/api/uploads/${filename}`;
        return NextResponse.json({ url });
    } catch (error: any) {
        console.error("[UPLOAD] Failed:", error.message, error.stack);
        return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }
}
