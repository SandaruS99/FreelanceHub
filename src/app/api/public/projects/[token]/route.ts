import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        await dbConnect();

        const project = await Project.findOne({ deliveryToken: token })
            .populate('freelancerId', 'name')
            .select('name deliveryFile deliveryToken freelancerId isDelivered deliveredAt');

        if (!project) {
            return NextResponse.json({ error: 'Invalid or expired preview link' }, { status: 404 });
        }

        return NextResponse.json({ project });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
