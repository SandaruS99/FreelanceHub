import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
// Need to import Client and Project to ensure they're registered for Population
import Project from '@/models/Project';
import Client from '@/models/Client';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    await dbConnect();
    const task = await Task.findOne({ _id: id, freelancerId: userId })
        .populate('clientId', 'name')
        .populate('projectId', 'name');

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json({ task });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { id } = await params;
    const data = await req.json();

    await dbConnect();
    const updated = await Task.findOneAndUpdate(
        { _id: id, freelancerId: userId },
        data,
        { new: true }
    )
        .populate('clientId', 'name')
        .populate('projectId', 'name');

    if (!updated) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json({ task: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    await dbConnect();
    const deleted = await Task.findOneAndDelete({ _id: id, freelancerId: userId });

    if (!deleted) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json({ message: 'Task deleted successfully' });
}
