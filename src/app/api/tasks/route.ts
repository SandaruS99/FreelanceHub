import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');

    await dbConnect();
    const query: Record<string, unknown> = { freelancerId: userId };
    if (status) query.status = status;
    if (projectId) query.projectId = projectId;

    const tasks = await Task.find(query)
        .populate('clientId', 'name')
        .populate('projectId', 'name')
        .sort({ createdAt: -1 });

    return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const data = await req.json();

    await dbConnect();
    const task = await Task.create({ ...data, freelancerId: userId });
    return NextResponse.json({ task }, { status: 201 });
}
