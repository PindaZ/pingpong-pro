import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await db.user.findUnique({
                    where: {
                        email: credentials.email,
                    },
                    include: {
                        memberships: {
                            include: {
                                organization: true,
                            },
                            orderBy: {
                                joinedAt: 'desc',
                            },
                            take: 1,
                        },
                    },
                });

                if (!user || !user.password) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                // Get the user's primary organization (most recent membership)
                const primaryMembership = user.memberships[0];

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    image: user.avatarUrl,
                    activeOrganizationId: primaryMembership?.organizationId,
                    orgRole: primaryMembership?.role,
                };
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.activeOrganizationId = token.activeOrganizationId as string;
                session.user.orgRole = token.orgRole as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.activeOrganizationId = (user as any).activeOrganizationId;
                token.orgRole = (user as any).orgRole;
            }
            return token;
        }
    }
};
