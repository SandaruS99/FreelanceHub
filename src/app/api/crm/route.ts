import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CrmLog from '@/models/CrmLog';
import Client from '@/models/Client'; // For population
import { auth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const clientId = req.nextUrl.searchParams.get('client');

    await dbConnect();

    const query: any = { freelancerId: userId };
    if (clientId) query.clientId = clientId;

    // sort newest first
    const logs = await CrmLog.find(query)
        .sort({ date: -1 })
        .populate('clientId', 'name company');

    return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const data = await req.json();

    if (!data.clientId || !data.type || !data.content) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    const log = await CrmLog.create({
        ...data,
        freelancerId: userId,
    });

    await logActivity(userId, 'CRM Action', `Logged ${data.type}: ${data.title}`);

    return NextResponse.json({ log }, { status: 201 });
}
