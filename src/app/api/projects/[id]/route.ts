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
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = (session.user as { id: string }).id;
        const { id } = await params;
        const data = await req.json();

        // Sanitize data: remove empty strings for dates, and map endDate to deadline
        const sanitizedData = { ...data };
        if (sanitizedData.startDate === '') sanitizedData.startDate = null;
        if (sanitizedData.endDate === '') {
            sanitizedData.deadline = null;
        } else if (sanitizedData.endDate) {
            sanitizedData.deadline = sanitizedData.endDate;
        }
        delete sanitizedData.endDate;

        await dbConnect();
        const updated = await Project.findOneAndUpdate(
            { _id: id, freelancerId: userId },
            sanitizedData,
            { new: true, runValidators: true }
        ).populate('clientId', 'name company email whatsapp');

        if (!updated) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        await logActivity(userId, 'Updated Project', `Project: ${updated.name}`);

        return NextResponse.json({ project: updated });
    } catch (error: any) {
        console.error('PATCH project error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
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
