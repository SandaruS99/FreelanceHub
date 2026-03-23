import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Client from '@/models/Client';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    await dbConnect();
    const client = await Client.findOne({ _id: id, freelancerId: userId });

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    return NextResponse.json({ client });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { id } = await params;
    const data = await req.json();

    await dbConnect();
    const updated = await Client.findOneAndUpdate(
        { _id: id, freelancerId: userId },
        data,
        { new: true }
    );

    if (!updated) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    return NextResponse.json({ client: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    await dbConnect();
    const deleted = await Client.findOneAndDelete({ _id: id, freelancerId: userId });

    if (!deleted) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    return NextResponse.json({ message: 'Client deleted successfully' });
}
