'use server';

import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { error: "Missing required fields" };
    }

    // Advanced Password Validation
    const hasCapital = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (password.length < 8) {
        return { error: "Password must be at least 8 characters long" };
    }
    if (!hasCapital || !hasNumber) {
        return { error: "Password must contain at least one capital letter and one number" };
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return { error: "User already exists" };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            } as any
        });

        return { success: true };
    } catch (e) {
        console.error("Registration error:", e);
        return { error: "Registration failed" };
    }
}
