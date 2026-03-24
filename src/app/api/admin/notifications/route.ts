import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { auth } from '@/lib/auth';

// POST: Admin creates a notification
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const user = session?.user as { role?: string; id?: string } | undefined;

        if (!session || user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const { target, title, message, type } = data; // target can be 'all', 'active', or a specific userId

        await dbConnect();

        let userIds: string[] = [];

        if (target === 'all' || target === 'active') {
            const query = target === 'active' ? { status: 'active' } : {};
            const users = await User.find(query).select('_id');
            userIds = users.map(u => u._id.toString());
        } else if (target) {
            // Specific user
            userIds = [target];
        }

        if (userIds.length === 0) {
            return NextResponse.json({ error: 'No users found for the target criteria' }, { status: 400 });
        }

        const notifications = userIds.map(userId => ({
            userId,
            title,
            message,
            type: type || 'info',
            read: false,
        }));

        await Notification.insertMany(notifications);

        return NextResponse.json({ message: `Successfully sent ${userIds.length} notifications`, count: userIds.length }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating notification:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
