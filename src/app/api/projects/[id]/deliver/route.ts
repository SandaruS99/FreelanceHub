import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import File from '@/models/File';
import crypto from 'crypto';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const formData = await req.formData();
        const file = formData.get('file') as unknown as File & { arrayBuffer(): Promise<ArrayBuffer>, name: string, type: string, size: number };

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        await dbConnect();

        // 1. Check project ownership
        const project = await Project.findOne({ _id: id, freelancerId: session.user.id });
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        // 2. Generate security token for preview
        const deliveryToken = crypto.randomBytes(32).toString('hex');

        // 3. Store file data in the database
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const newFile = await File.create({
            name: file.name,
            mimeType: file.type,
            size: file.size,
            data: buffer,
            projectId: project._id
        });

        // 4. Update project status
        project.status = 'completed';
        project.isDelivered = true;
        project.deliveredAt = new Date();
        project.deliveryToken = deliveryToken;
        project.deliveryFileName = file.name;
        project.deliveryFileId = newFile._id;

        await project.save();

        return NextResponse.json({
            message: 'Project delivered successfully',
            project: {
                _id: project._id,
                deliveryToken: project.deliveryToken,
                isDelivered: project.isDelivered,
                status: project.status
            }
        });
    } catch (error: any) {
        console.error('DELIVERY_ERROR:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
