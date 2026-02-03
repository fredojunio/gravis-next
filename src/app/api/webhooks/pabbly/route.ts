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

        // 4. Generate Random Password
        // Requirements: 8+ chars, 1 Capital, 1 Number
        const tempPassword = crypto.randomBytes(8).toString('hex') + "A1";
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // 5. Create User
        const newUser = await prisma.user.create({
            data: {
                email,
                name: name || email.split('@')[0],
                password: hashedPassword,
            } as any
        });

        // 6. Return Success (In real world, you might send an email here)
        return NextResponse.json({
            success: true,
            userId: newUser.id,
            message: "User created successfully",
            // Note: In production, don't return the raw password in the response if Pabbly logs it.
            // But since the user asked for "generated password", providing it for Pabbly to send to the user via email.
            tempPassword: tempPassword
        }, { status: 201 });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
