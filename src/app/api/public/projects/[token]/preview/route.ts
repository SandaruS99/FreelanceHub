import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import File from '@/models/File';

/**
 * Serves the delivery file inline for browser preview (not as a download).
 * Payment is NOT required to preview — only to download the original via /file.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        await dbConnect();

        const project = await Project.findOne({ deliveryToken: token });
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (!project.deliveryFileId) {
            return NextResponse.json({ error: 'No file attached to this project' }, { status: 404 });
        }

        const file = await File.findById(project.deliveryFileId);
        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        return new NextResponse(file.data, {
            headers: {
                'Content-Type': file.mimeType,
                // inline = render in browser, not download
                'Content-Disposition': `inline; filename="${file.name}"`,
                // Prevent caching to avoid leaking file data
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error: any) {
        console.error('PREVIEW_ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
