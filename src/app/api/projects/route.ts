import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import Task from '@/models/Task';
import { auth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

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
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = (session.user as { id: string }).id;
        const { tasks, ...projectData } = await req.json();

        // Sanitize data
        if (projectData.startDate === '') projectData.startDate = null;
        if (projectData.endDate === '') {
            projectData.deadline = null;
        } else if (projectData.endDate) {
            projectData.deadline = projectData.endDate;
        }
        delete projectData.endDate;

        await dbConnect();

        // Create the project
        const project = await Project.create({
            ...projectData,
            freelancerId: userId
        });

    // Create tasks if provided
    if (tasks && Array.isArray(tasks) && tasks.length > 0) {
        const tasksToCreate = tasks.map(task => ({
            ...task,
            freelancerId: userId,
            projectId: project._id,
            clientId: projectData.clientId // Link to the same client
        }));
        await Task.insertMany(tasksToCreate);
    }

    await logActivity(userId, 'Created Project', `Project: ${projectData.name}${tasks?.length ? ` with ${tasks.length} tasks` : ''}`);

    return NextResponse.json({ project }, { status: 201 });
    } catch (error: any) {
        console.error('POST project error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
