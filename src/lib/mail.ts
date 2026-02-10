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
            subject: 'Reset your password for Gravis EDU',
            html: `
                <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; background-color: #4338ca; border-radius: 20px; color: white; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                    <div style="padding: 40px 30px; text-align: center;">
                        <div style="margin-bottom: 20px;">
                            <span style="font-size: 24px; font-weight: 800; letter-spacing: 2px;">GRAVIS</span>
                        </div>
                        
                        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 20px; color: white;">Hi there,</h1>
                        
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px; color: rgba(255,255,255,0.9);">
                            As part of your enrollment, we've created an account for you on Gravis EDU. Please set your password to get started.
                        </p>
                        
                        <div style="margin-bottom: 30px;">
                            <a href="${resetLink}" style="display: inline-block; padding: 16px 36px; background-color: #ff6022; color: white; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 96, 34, 0.3);">
                                Set Up Your Password
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; color: rgba(255,255,255,0.7); margin-top: 40px; text-align: left;">
                            Best regards,<br>
                            <span style="font-weight: 700; color: white;">Gravis EDU</span>
                        </p>
                    </div>
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
