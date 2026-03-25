import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = (session.user as any).id;
        const data = await req.json();

        const allowed = ['name', 'businessName', 'businessAddress', 'phone', 'whatsapp', 'website', 'avatar'];
        const update: Record<string, string> = {};
        for (const key of allowed) {
            if (data[key] !== undefined) update[key] = data[key];
        }

        await dbConnect();
        const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password');
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({ success: true, user });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
