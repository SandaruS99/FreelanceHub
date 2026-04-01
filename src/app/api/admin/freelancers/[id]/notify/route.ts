import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { auth } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const sessionUser = session?.user as { role?: string } | undefined;
    if (!session || sessionUser?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, message, type = 'info' } = await req.json();

    if (!title || !message) {
        return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    if (!['info', 'success', 'warning', 'error'].includes(type)) {
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    await dbConnect();

    const targetUser = await User.findById(id);
    if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const notification = await Notification.create({
        userId: targetUser._id,
        title,
        message,
        type,
        read: false,
    });

    return NextResponse.json(
        { notification, message: `Notification sent to ${targetUser.name}` },
        { status: 201 }
    );
}
