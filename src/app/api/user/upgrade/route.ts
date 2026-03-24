import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id: string }).id;
        const data = await req.json();
        const { plan } = data;

        if (!['free', 'pro', 'business'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        user.plan = plan;
        await user.save();

        return NextResponse.json({ success: true, plan: user.plan });
    } catch (error: any) {
        console.error('Error upgrading plan:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
