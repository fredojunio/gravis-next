import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Secret Header
        const signature = req.headers.get("x-pabbly-secret");
        const secret = process.env.PABBLY_WEBHOOK_SECRET;

        if (!secret || signature !== secret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse Body
        const body = await req.json();

        // Map Pabbly fields to our schema
        const email = body.student_email || body.email;
        const name = body.student_name || (body.student_first_name ? `${body.student_first_name} ${body.student_last_name || ''}`.trim() : null) || body.name;

        if (!email) {
            return NextResponse.json({ error: "student_email is required" }, { status: 400 });
        }

        // 3. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ message: "User already exists", userId: existingUser.id }, { status: 200 });
        }

        // 4. Create User (without password)
        const newUser = await prisma.user.create({
            data: {
                email,
                name: name || email.split('@')[0],
                password: null, // User will set this via forgot password
            } as any
        });

        // 5. Return Success
        return NextResponse.json({
            success: true,
            userId: newUser.id,
            message: "User created. They should now use the 'Forgot Password' feature to set their password.",
        }, { status: 201 });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
