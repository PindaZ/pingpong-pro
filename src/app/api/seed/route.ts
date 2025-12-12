import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const mockUsers = [
    { name: "Alice Johnson", email: "alice@example.com", elo: 1250 },
    { name: "Bob Smith", email: "bob@example.com", elo: 1180 },
    { name: "Charlie Brown", email: "charlie@example.com", elo: 1320 },
    { name: "Diana Ross", email: "diana@example.com", elo: 1150 },
    { name: "Edward King", email: "edward@example.com", elo: 1280 },
    { name: "Fiona Apple", email: "fiona@example.com", elo: 1200 },
    { name: "George Lucas", email: "george@example.com", elo: 1350 },
    { name: "Hannah Montana", email: "hannah@example.com", elo: 1100 },
    { name: "Ivan Petrov", email: "ivan@example.com", elo: 1220 },
    { name: "Julia Roberts", email: "julia@example.com", elo: 1270 },
    { name: "Kevin Hart", email: "kevin@example.com", elo: 1190 },
    { name: "Lisa Simpson", email: "lisa@example.com", elo: 1300 },
    { name: "Mike Tyson", email: "mike@example.com", elo: 1400 },
    { name: "Nina Williams", email: "nina@example.com", elo: 1160 },
];

export async function GET(req: Request) {
    try {
        const hashedPassword = await bcrypt.hash("password123", 10);

        const createdUsers = [];
        for (const userData of mockUsers) {
            const user = await db.user.upsert({
                where: { email: userData.email },
                update: { elo: userData.elo },
                create: {
                    email: userData.email,
                    name: userData.name,
                    password: hashedPassword,
                    role: "USER",
                    elo: userData.elo,
                },
            });
            createdUsers.push({ name: user.name, email: user.email, elo: user.elo });
        }

        return NextResponse.json({
            message: `${createdUsers.length} mock users created/updated`,
            users: createdUsers,
            password: "password123 (for all users)",
        });
    } catch (error) {
        console.error("Seed failed:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
