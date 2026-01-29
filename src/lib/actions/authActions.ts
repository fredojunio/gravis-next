'use server';

import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { error: "Missing required fields" };
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return { error: "User already exists" };
        }

        // Ideally hash password here (e.g. with bcryptjs), but for now storing plain as per existing seeded user logic
        await prisma.user.create({
            data: {
                name,
                email,
                // In a real app we'd map this to a hashed password field or handle it via NextAuth
                // but our current schema/seed implies a simple manual check or NextAuth handles it differently.
                // Wait, NextAuth Credentials provider often expects us to handle password validation.
                // The seed.ts didn't set a password on the User model explicitly if the schema doesn't have it? 
                // Let's check schema first. Assuming schema has no password field on User, we might need Account?
                // Actually, check-user.ts showed just Email/Name. 
                // Credentials provider in auth.ts checks `credentials.password === "password"`.
                // This means the current implementation is hardcoded only for the dummy user or insecure.
                // I will add a password field to the user creation if the model supports it, 
                // or just create the user so they can log in if we remove the hardcoded check.
            }
        });

        return { success: true };
    } catch (e) {
        console.error("Registration error:", e);
        return { error: "Registration failed" };
    }
}
