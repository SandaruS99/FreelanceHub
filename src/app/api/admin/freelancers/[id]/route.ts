import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/lib/auth';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const user = session?.user as { role?: string } | undefined;
    if (!session || user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!['active', 'suspended', 'pending'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await dbConnect();

    const updated = await User.findByIdAndUpdate(
        id,
        { status },
        { new: true, select: '-password' }
    );

    if (!updated) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: updated, message: `Account ${status} successfully` });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const user = session?.user as { role?: string } | undefined;
    if (!session || user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: 'User deleted successfully' });
}
