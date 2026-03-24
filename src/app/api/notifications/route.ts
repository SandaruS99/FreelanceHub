import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { auth } from '@/lib/auth';

// GET: Fetch user's notifications
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        const user = session?.user as { id?: string } | undefined;

        if (!session || !user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get('unread') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        await dbConnect();

        const query: any = { userId: user.id };
        if (unreadOnly) {
            query.read = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);

        const unreadCount = await Notification.countDocuments({ userId: user.id, read: false });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
