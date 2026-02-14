import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Notice this is just a regular object, not calling NextAuth()
export default {
    providers: [
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

            // Allow public assets to bypass the redirect logic
            const isPublicAsset =
                nextUrl.pathname.startsWith("/logo/") ||
                nextUrl.pathname.startsWith("/images/") ||
                nextUrl.pathname.endsWith(".png") ||
                nextUrl.pathname.endsWith(".jpg") ||
                nextUrl.pathname.endsWith(".svg") ||
                nextUrl.pathname.endsWith(".ico");

            if (isOnApp) {
                if (isLoggedIn) return true;
                return false;
            } else if (isLoggedIn && !isPublicAsset) {
                return Response.redirect(new URL("/app", nextUrl));
            }
            return true;
        },
    },
} satisfies NextAuthConfig;
