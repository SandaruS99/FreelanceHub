import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { auth } from '@/lib/auth';

// PATCH: Mark notification as read
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        const user = session?.user as { id?: string } | undefined;

        if (!session || !user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;

        await dbConnect();

        // If ID is 'all', mark all as read for this user
        if (resolvedParams.id === 'all') {
            await Notification.updateMany({ userId: user.id, read: false }, { read: true });
            return NextResponse.json({ success: true, message: 'All notifications marked as read' });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: resolvedParams.id, userId: user.id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, notification });
    } catch (error: any) {
        console.error('Error updating notification:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
