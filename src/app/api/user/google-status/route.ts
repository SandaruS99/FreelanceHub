import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;

    await dbConnect();
    const user = await User.findById(userId).select('googleRefreshToken googleAccessToken');

    return NextResponse.json({
        connected: !!user?.googleRefreshToken,
    });
}
