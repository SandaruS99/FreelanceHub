import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email });

        // We DO NOT want to leak whether the email exists for security reasons,
        // so we always return 200 OK whether it exists or not.
        if (!user) {
            return NextResponse.json({ message: 'If that email is in our database, we will send a password reset link.' });
        }

        // Generate a 32-character secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiration = new Date(Date.now() + 3600000); // 1 hour from now

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = tokenExpiration;
        await user.save();

        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

        try {
            await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
                to: user.email,
                subject: 'FreelanceHub - Password Reset Request',
                html: `
                    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
                        <h2 style="color: #6366f1;">Password Reset Request</h2>
                        <p>Hi ${user.name},</p>
                        <p>We received a request to reset your password for your FreelanceHub account. If you didn't initiate this request, you can safely ignore this email.</p>
                        <p>To choose a new password, click the button below:</p>
                        <div style="margin: 30px 0;">
                            <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reset Password</a>
                        </div>
                        <p style="font-size: 14px; color: #666;">This link will expire in 1 hour.</p>
                        <hr style="border: none; border-top: 1px solid #eaeaea; margin-top: 40px; margin-bottom: 20px;" />
                        <p style="font-size: 12px; color: #999;">If the button doesn't work, copy and paste this link into your browser:<br/>${resetUrl}</p>
                    </div>
                `,
            });
        } catch (emailError) {
            console.error('Failed to send reset email:', emailError);
            return NextResponse.json({ error: 'Failed to send reset email.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'If that email is in our database, we will send a password reset link.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
