import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import Notification from '@/models/Notification';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const { message, clientName } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Revision message is required' }, { status: 400 });
        }

        await dbConnect();

        const project = await Project.findOne({ deliveryToken: token });
        if (!project) {
            return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
        }

        // Add revision
        project.revisions.push({
            message,
            clientName: clientName || 'Client',
            status: 'pending',
            submittedAt: new Date()
        });

        // Set project back to active and not delivered so freelancer can re-deliver
        project.status = 'active';
        project.isDelivered = false;

        await project.save();

        // Notify freelancer
        await Notification.create({
            userId: project.freelancerId,
            title: 'Revision Requested',
            message: `A client requested revisions for the project: "${project.name}"`,
            type: 'warning',
            link: `/dashboard/projects/${project._id}`
        });

        return NextResponse.json({ success: true, project });
    } catch (error: any) {
        console.error('REVISION_SUBMIT_ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
