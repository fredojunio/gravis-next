import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import Google from "next-auth/providers/google";

// Notice this is just a regular object, not calling NextAuth()
export default {
    providers: [
        Google,
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // This will be overridden in auth.ts because we need Prisma there
                return null;
            },
        }),
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnApp = nextUrl.pathname.startsWith("/app");
            if (isOnApp) {
                if (isLoggedIn) return true;
                return false;
            } else if (isLoggedIn) {
                return Response.redirect(new URL("/app", nextUrl));
            }
            return true;
        },
    },
} satisfies NextAuthConfig;
