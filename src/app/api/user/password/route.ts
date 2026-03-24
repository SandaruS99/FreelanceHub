import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = (session.user as any).id;
        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
        }
        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findById(userId).select('+password');
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

        user.password = newPassword; // pre-save hook will hash it
        await user.save();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
