import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import File from '@/models/File';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        await dbConnect();

        const project = await Project.findOne({ deliveryToken: token });
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        // SECURITY CHECK: Only allow download if paid
        if (!project.isPaid) {
            return NextResponse.json({ error: 'Payment required to download' }, { status: 403 });
        }

        const file = await File.findById(project.deliveryFileId);
        if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

        return new NextResponse(file.data, {
            headers: {
                'Content-Type': file.mimeType,
                'Content-Disposition': `attachment; filename="${file.name}"`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
