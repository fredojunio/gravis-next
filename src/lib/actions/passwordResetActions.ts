'use server';

import prisma from "@/lib/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Request a password reset. Calculates a token and saves it.
 * In a real app, this would send an email.
 */
export async function requestPasswordReset(email: string) {
    if (!email) return { error: "Email is required" };

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        // Security best practice: don't reveal if user exists
        if (!user) return { success: true };

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour from now

        // Store token
        await (prisma as any).passwordResetToken.upsert({
            where: { email_token: { email, token } },
            update: { expires },
            create: { email, token, expires }
        });

        // Construct reset link
        const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password/${token}`;

        // TODO: Send email
        console.log(`[PASSWORD RESET] Link for ${email}: ${resetLink}`);

        return { success: true };
    } catch (e) {
        console.error("Password reset request error:", e);
        return { error: "Failed to process request" };
    }
}

/**
 * Verify token and update password
 */
export async function resetPassword(token: string, password: string) {
    if (!token || !password) return { error: "Missing required data" };

    // Validation
    const hasCapital = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (password.length < 8 || !hasCapital || !hasNumber) {
        return { error: "Password does not meet complexity requirements" };
    }

    try {
        const resetToken = await (prisma as any).passwordResetToken.findUnique({
            where: { token }
        });

        if (!resetToken || resetToken.expires < new Date()) {
            return { error: "Token is invalid or has expired" };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password and delete token
        await prisma.$transaction([
            prisma.user.update({
                where: { email: resetToken.email },
                data: { password: hashedPassword } as any
            }),
            (prisma as any).passwordResetToken.delete({
                where: { token }
            })
        ]);

        return { success: true };
    } catch (e) {
        console.error("Reset password error:", e);
        return { error: "Failed to reset password" };
    }
}
