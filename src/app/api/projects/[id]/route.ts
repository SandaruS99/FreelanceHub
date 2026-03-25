import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import Client from '@/models/Client'; // Ensure Client is registered for population
import { auth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    await dbConnect();
    const project = await Project.findOne({ _id: id, freelancerId: userId }).populate('clientId', 'name company email whatsapp');

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    return NextResponse.json({ project });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { id } = await params;
    const data = await req.json();

    await dbConnect();
    const updated = await Project.findOneAndUpdate(
        { _id: id, freelancerId: userId },
        data,
        { new: true }
    ).populate('clientId', 'name company');

    if (!updated) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    await logActivity(userId, 'Updated Project', `Project: ${updated.name}`);

    return NextResponse.json({ project: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    await dbConnect();
    const deleted = await Project.findOneAndDelete({ _id: id, freelancerId: userId });

    if (!deleted) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    await logActivity(userId, 'Deleted Project', `Project: ${deleted.name}`);

    return NextResponse.json({ message: 'Project deleted successfully' });
}
