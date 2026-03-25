import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UserActivity from '@/models/UserActivity';
import { auth } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        // Check if user is admin
        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const activities = await UserActivity.find({ userId: id })
            .sort({ createdAt: -1 })
            .limit(100);

        return NextResponse.json({ activities });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
