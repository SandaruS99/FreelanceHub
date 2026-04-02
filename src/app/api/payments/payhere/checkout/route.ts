import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import { generatePayHereHash, PAYHERE_URL, convertToLKR } from '@/lib/payhere';
import { auth } from '@/lib/auth';

/**
 * Generates signed PayHere checkout parameters for an Invoice or Plan update.
 */
export async function POST(req: NextRequest) {
    // Check for required configuration early
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_SECRET;

    if (!merchantId || !merchantSecret) {
        console.error('CRITICAL: PayHere credentials missing in environment variables.');
        return NextResponse.json({
            error: 'Payment system not configured. Please add PAYHERE_MERCHANT_ID and PAYHERE_SECRET to your environment.'
        }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { type, id, returnUrl } = body; // type: 'invoice' | 'plan', returnUrl is optional override

        await dbConnect();

        let orderId = '';
        let amount = 0;
        let currency = 'USD';
        let items = '';
        let customer = { name: '', email: '', phone: '', address: '', city: '', country: 'Sri Lanka' };

        if (type === 'invoice') {
            const invoice = await Invoice.findOne({ publicToken: id }).populate('freelancerId clientId');
            if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

            // Shorten orderId to stay under 40 characters (INV + _id is 28 chars)
            orderId = `INV-${invoice._id.toString()}`;
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

            // Shorten orderId to stay under 40 characters
            orderId = `PLAN-${(session.user as any).id}-${id}`;
            amount = plan.price;
            currency = 'USD';
            items = `Subscription Upgrade: ${plan.name}`;
            customer = {
                name: session.user.name || 'Sandbox Customer',
                email: session.user.email || 'sandbox@example.com',
                phone: (session.user as any).phone || (session.user as any).whatsapp || '0000000000',
                address: 'No Address',
                city: 'No City',
                country: 'Sri Lanka'
            };
        }

        const finalAmount = convertToLKR(amount, currency);
        const finalCurrency = 'LKR';

        const hash = generatePayHereHash(orderId, finalAmount, finalCurrency);

        const defaultReturnPath = type === 'invoice' ? `/preview/invoice/${id}/pay` : '/dashboard/settings/billing';
        const finalReturnUrl = returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}${defaultReturnPath}`;

        const params = {
            merchant_id: process.env.PAYHERE_MERCHANT_ID,
            return_url: `${finalReturnUrl}?status=success`,
            cancel_url: `${finalReturnUrl}?status=cancelled`,
            notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/payhere/notify`,
            order_id: orderId,
            items: items,
            currency: finalCurrency,
            amount: finalAmount.toFixed(2),
            first_name: customer.name.split(' ')[0] || 'Customer',
            last_name: customer.name.split(' ').slice(1).join(' ') || 'Name',
            email: customer.email || 'customer@example.com',
            phone: customer.phone || '0000000000',
            address: customer.address || 'No Address',
            city: customer.city || 'No City',
            country: customer.country || 'Sri Lanka',
            hash,
            payhere_url: PAYHERE_URL,
        };

        return NextResponse.json(params);
    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Failed to generate checkout' }, { status: 500 });
    }
}
