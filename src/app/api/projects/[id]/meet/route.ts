import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { createMeetEvent } from '@/lib/google';
import { logActivity } from '@/lib/activity';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await props.params;
    const { id } = params;
    const userId = (session.user as any).id;

    try {
        await dbConnect();

        // 1. Find project and populate client email
        const project = await Project.findOne({ _id: id, freelancerId: userId }).populate('clientId', 'name email');
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        const client = project.clientId as any;
        if (!client?.email) {
            return NextResponse.json({ 
                error: 'Client email is missing. Please add an email address to this client to schedule a Google Meet.' 
            }, { status: 400 });
        }

        // 2. Generate the meeting link via Google Calendar API
        const meetLink = await createMeetEvent(userId, client.email, project.name);

        if (!meetLink) {
            return NextResponse.json({ 
                error: 'Failed to generate Google Meet link. Ensure your Google account is connected.' 
            }, { status: 500 });
        }

        // 3. Save link to project and log it
        project.googleMeetLink = meetLink;
        await project.save();

        await logActivity(userId, 'Created Meeting', `Auto-generated Meet link for: ${project.name}`);

        return NextResponse.json({ meetLink });
    } catch (error: any) {
        console.error('Create Meet Error:', error);
        
        const isAuthError = error.message.toLowerCase().includes('not connected') || 
                           error.message.toLowerCase().includes('authenticated');
                           
        return NextResponse.json({ 
            error: isAuthError 
                ? 'Google account disconnected. Please reconnect in account settings.' 
                : (error.message || 'Internal server error')
        }, { status: isAuthError ? 401 : 500 });
    }
}
