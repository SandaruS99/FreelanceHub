import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client'; // Ensure Client is registered
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    await dbConnect();
    const invoice = await Invoice.findOne({ _id: id, freelancerId: userId }).populate('clientId', 'name company email address');

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json({ invoice });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { id } = await params;
    const data = await req.json();

    await dbConnect();

    // If line items, tax, or discount changed, we might need to recalculate total
    // But for simple status updates (like mark as paid), we just update the fields
    const updated = await Invoice.findOneAndUpdate(
        { _id: id, freelancerId: userId },
        data,
        { new: true }
    ).populate('clientId', 'name company');

    if (!updated) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json({ invoice: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    await dbConnect();
    const deleted = await Invoice.findOneAndDelete({ _id: id, freelancerId: userId });

    if (!deleted) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json({ message: 'Invoice deleted successfully' });
}
