import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

    return <SettingsClient isAdmin={isAdmin} currentUserRole={user?.role || "USER"} />;
}
