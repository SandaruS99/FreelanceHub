import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Client from '@/models/Client';
import { auth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? '';
    const tag = searchParams.get('tag') ?? '';
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');

    await dbConnect();

    const query: Record<string, unknown> = { freelancerId: userId };
    if (status) query.status = status;
    if (tag) query.tags = tag;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
        ];
    }

    const [clients, total] = await Promise.all([
        Client.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Client.countDocuments(query),
    ]);

    return NextResponse.json({ clients, total, page, pages: Math.ceil(total / limit) });
}

import User from '@/models/User';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const data = await req.json();

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.plan === 'free') {
        const clientCount = await Client.countDocuments({ freelancerId: userId });
        if (clientCount >= 5) {
            return NextResponse.json({
                error: 'Free plan is limited to 5 clients. Please upgrade to add more.'
            }, { status: 403 });
        }
    }

    const client = await Client.create({ ...data, freelancerId: userId });

    await logActivity(userId, 'Created Client', `Client: ${client.name}`);

    return NextResponse.json({ client }, { status: 201 });
}
