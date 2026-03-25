import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import { generatePayHereHash } from '@/lib/payhere';
import { auth } from '@/lib/auth';

/**
 * Generates signed PayHere checkout parameters for an Invoice or Plan update.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, id } = body; // type: 'invoice' | 'plan', id: token or planId

        await dbConnect();

        let orderId = '';
        let amount = 0;
        let currency = 'USD';
        let items = '';
        let customer = { name: '', email: '', phone: '', address: '', city: '', country: 'Sri Lanka' };

        if (type === 'invoice') {
            const invoice = await Invoice.findOne({ publicToken: id }).populate('freelancerId clientId');
            if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

            orderId = `INV-${invoice.invoiceNumber}-${invoice.publicToken}`;
            amount = invoice.total;
            currency = invoice.currency;
            items = `Invoice #${invoice.invoiceNumber}`;
            customer = {
                name: (invoice.clientId as any).name,
                email: (invoice.clientId as any).email,
                phone: (invoice.clientId as any).phone || '',
                address: (invoice.clientId as any).address || 'No Address',
                city: (invoice.clientId as any).city || 'No City',
                country: 'Sri Lanka'
            };
        } else if (type === 'plan') {
            const session = await auth();
            if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const planDetails: Record<string, { price: number; name: string }> = {
                pro: { price: 9.99, name: 'Pro Plan' },
                business: { price: 29.99, name: 'Business Plan' }
            };

            const plan = planDetails[id as string];
            if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

            orderId = `PLAN-${(session.user as any).id}-${id}-${Date.now()}`;
            amount = plan.price;
            currency = 'USD';
            items = `Subscription Upgrade: ${plan.name}`;
            customer = {
                name: session.user.name || '',
                email: session.user.email || '',
                phone: (session.user as any).phone || '',
                address: 'N/A',
                city: 'N/A',
                country: 'Sri Lanka'
            };
        }

        const hash = generatePayHereHash(orderId, amount, currency);

        const params = {
            merchant_id: process.env.PAYHERE_MERCHANT_ID,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}${type === 'invoice' ? `/preview/invoice/${id}/pay` : '/dashboard/settings/billing'}?status=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}${type === 'invoice' ? `/preview/invoice/${id}/pay` : '/dashboard/settings/billing'}?status=cancelled`,
            notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/payhere/notify`,
            order_id: orderId,
            items: items,
            currency: currency,
            amount: amount.toFixed(2),
            first_name: customer.name.split(' ')[0],
            last_name: customer.name.split(' ').slice(1).join(' ') || 'Customer',
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            city: customer.city,
            country: customer.country,
            hash
        };

        return NextResponse.json(params);
    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Failed to generate checkout' }, { status: 500 });
    }
}
