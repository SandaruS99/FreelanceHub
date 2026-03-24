import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const { token, newPassword } = await req.json();

        if (!token || !newPassword) {
            return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        await dbConnect();

        // Find user by token, and ensure the token hasn't expired yet
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return NextResponse.json({ error: 'Password reset token is invalid or has expired' }, { status: 400 });
        }

        // Extremely important: Hash the new password before saving it!
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // Since we already hashed it manually, we bypass the Schema pre-save hook 
        // OR the pre-save hook handles it if we just assign the raw password string.
        // Let's check: The pre-save hook in User.ts is:
        // UserSchema.pre('save', async function () {
        //     if (!this.isModified('password')) return;
        //     this.password = await bcrypt.hash(this.password, 12);
        // });
        // Wait, if the pre-save hook already hashes it, hashing it here will cause DOUBLE HASHING!
        // To be safe and utilize the schema hook correctly, we assign the raw password and let Mongoose handle it.

        user.password = newPassword;
        
        await user.save();

        return NextResponse.json({ message: 'Password has been successfully reset' }, { status: 200 });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
