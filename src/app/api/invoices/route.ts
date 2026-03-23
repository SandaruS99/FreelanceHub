import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import { auth } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    await dbConnect();
    const query: Record<string, unknown> = { freelancerId: userId };
    if (status) query.status = status;

    const invoices = await Invoice.find(query)
        .populate('clientId', 'name company email')
        .populate('projectId', 'name')
        .sort({ createdAt: -1 });

    return NextResponse.json({ invoices });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const data = await req.json();

    await dbConnect();

    // Auto-generate invoice number
    const count = await Invoice.countDocuments({ freelancerId: userId });
    const invoiceNumber = data.invoiceNumber || `INV-${String(count + 1).padStart(4, '0')}`;
    const publicToken = randomBytes(24).toString('hex');

    // Calculate totals
    const lineItems = data.lineItems ?? [];
    const subtotal = lineItems.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0);
    const taxTotal = lineItems.reduce((sum: number, item: { quantity: number; unitPrice: number; taxRate: number }) => sum + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
    const discount = data.discount ?? 0;
    const discountAmt = data.discountType === 'percentage' ? subtotal * (discount / 100) : discount;
    const total = subtotal + taxTotal - discountAmt;

    // Update line item totals
    const processedItems = lineItems.map((item: { quantity: number; unitPrice: number; taxRate: number; description: string }) => ({
        ...item,
        total: item.quantity * item.unitPrice,
    }));

    const invoice = await Invoice.create({
        ...data,
        freelancerId: userId,
        invoiceNumber,
        publicToken,
        lineItems: processedItems,
        subtotal,
        taxTotal,
        total,
    });

    return NextResponse.json({ invoice }, { status: 201 });
}
