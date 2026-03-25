import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { auth } from '@/lib/auth';
import { randomBytes } from 'crypto';
import { logActivity } from '@/lib/activity';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = (session.user as { id: string }).id;
        const { id } = await params;
        const { deliveryFile, deliveryNote } = await req.json();

        if (!deliveryFile) {
            return NextResponse.json({ error: 'Delivery file is required' }, { status: 400 });
        }

        await dbConnect();

        // Generate a unique token for the view-only link
        const deliveryToken = randomBytes(24).toString('hex');

        const updated = await Project.findOneAndUpdate(
            { _id: id, freelancerId: userId },
            {
                deliveryFile,
                deliveryToken,
                isDelivered: true,
                deliveredAt: new Date(),
                status: 'completed',
                progress: 100,
            },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        await logActivity(userId, 'Delivered Project', `Project: ${updated.name}`);

        return NextResponse.json({ project: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
