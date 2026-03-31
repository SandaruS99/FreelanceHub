import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import Client from '@/models/Client';
import { createMeetEvent } from '@/lib/google';
import { logActivity } from '@/lib/activity';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await props.params;
    const { id } = params;
    const userId = (session.user as any).id;

    const body = await req.json();
    const { startDateTime, durationMinutes = 60 } = body;

    if (!startDateTime) {
        return NextResponse.json({ error: 'Meeting start date and time are required.' }, { status: 400 });
    }

    try {
        await dbConnect();

        // Find project and populate client with email
        const project = await Project.findOne({ _id: id, freelancerId: userId }).populate('clientId', 'name email');
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        const client = project.clientId as any;
        if (!client?.email) {
            return NextResponse.json({
                error: 'Client email is missing. Please add an email address to this client before scheduling a meeting.'
            }, { status: 400 });
        }

        // Create the Google Meet event
        const meetLink = await createMeetEvent(userId, client.email, project.name, startDateTime, durationMinutes);

        // Persist the link on the project
        project.googleMeetLink = meetLink;
        await project.save();

        await logActivity(userId, 'Scheduled Meeting', `Google Meet scheduled for project: ${project.name}`);

        return NextResponse.json({ meetLink });
    } catch (error: any) {
        console.error('Create Meet Error:', error);

        const isAuthError =
            error.message?.toLowerCase().includes('not connected') ||
            error.message?.toLowerCase().includes('authenticated') ||
            error.code === 401;

        return NextResponse.json({
            error: isAuthError
                ? 'Google account not connected. Please connect your Google account in Settings → Integrations.'
                : (error.message || 'Failed to create meeting. Please try again.')
        }, { status: isAuthError ? 401 : 500 });
    }
}
