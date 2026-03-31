import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;

    await dbConnect();
    await User.findByIdAndUpdate(userId, {
        $unset: {
            googleAccessToken: '',
            googleRefreshToken: '',
            googleTokenExpiry: '',
        },
    });

    return NextResponse.json({ message: 'Google account disconnected successfully.' });
}
