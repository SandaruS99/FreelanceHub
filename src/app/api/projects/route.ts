import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    await dbConnect();

    const query: Record<string, unknown> = { freelancerId: userId };
    if (clientId) query.clientId = clientId;
    if (status) query.status = status;

    const projects = await Project.find(query)
        .populate('clientId', 'name company email avatar')
        .sort({ createdAt: -1 });

    return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const data = await req.json();

    await dbConnect();

    const project = await Project.create({
        ...data,
        freelancerId: userId
    });

    return NextResponse.json({ project }, { status: 201 });
}
