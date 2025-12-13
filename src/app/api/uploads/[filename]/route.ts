import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;

    try {
        // Sanitize filename to prevent directory traversal
        const sanitizedFilename = path.basename(filename);

        // Use /app/public/uploads in production (Docker) or cwd/public/uploads locally
        const isDocker = process.env.NODE_ENV === "production";
        const uploadDir = isDocker
            ? "/app/public/uploads"
            : path.join(process.cwd(), "public/uploads");

        const filePath = path.join(uploadDir, sanitizedFilename);

        console.log("[SERVE] Looking for file:", filePath);

        const fileBuffer = await readFile(filePath);

        // Determine content type
        const ext = path.extname(sanitizedFilename).toLowerCase();
        let contentType = "application/octet-stream";

        switch (ext) {
            case ".jpg":
            case ".jpeg":
                contentType = "image/jpeg";
                break;
            case ".png":
                contentType = "image/png";
                break;
            case ".gif":
                contentType = "image/gif";
                break;
            case ".webp":
                contentType = "image/webp";
                break;
            case ".svg":
                contentType = "image/svg+xml";
                break;
        }

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error: any) {
        console.error("[SERVE] File not found:", error.message);
        return new NextResponse("File not found", { status: 404 });
    }
}
