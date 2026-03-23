import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        const body = await req.json();
        const { method, amount } = body;

        await dbConnect();

        const invoice = await Invoice.findOne({ publicToken: token });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        if (invoice.status === 'paid') {
            return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
        }

        // Mock payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mark as paid
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        invoice.paidAmount = amount || invoice.total;
        invoice.paymentMethod = method || 'Credit Card';

        await invoice.save();

        return NextResponse.json({ success: true, message: 'Payment successful', invoice });
    } catch (error) {
        console.error('Payment processing error:', error);
        return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
    }
}
