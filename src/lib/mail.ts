import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const domain = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const fromEmail = process.env.EMAIL_FROM
    ? `Gravis Edu AI <${process.env.EMAIL_FROM}>`
    : 'onboarding@resend.dev';

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetLink = `${domain}/auth/reset-password/${token}`;

    try {
        console.log(`Attempting to send password reset email to: ${email} from: ${fromEmail}`);

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: 'Reset your password',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>You requested a password reset for your Gravis account. Click the button below to set a new password:</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Reset Password</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #666;">Sent by Gravis Edu AI</p>
                </div>
            `
        });

        if (error) {
            console.error("Resend API error:", error);
            return { error: error.message };
        }

        console.log("Resend response data:", data);
        return { success: true, data };
    } catch (error) {
        console.error("Caught error sending email:", error);
        return { error: "Failed to send email" };
    }
};
