import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import User from '@/models/User';
import { verifyPayHereSignature } from '@/lib/payhere';

/**
 * PayHere Instant Payment Notification (IPN) Handler
 * This handles asynchronous payment confirmation from PayHere.
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const params: Record<string, string> = {};
        formData.forEach((value, key) => {
            params[key] = value.toString();
        });

        console.log('PayHere IPN Received:', params.order_id, params.status_code);

        // 1. Verify Signature
        if (!verifyPayHereSignature(params)) {
            console.error('Invalid PayHere signature for order:', params.order_id);
            return new NextResponse('Invalid Signature', { status: 400 });
        }

        // 2. Connect to DB
        await dbConnect();

        const { order_id, status_code, payhere_amount, method, payment_id } = params;

        // 3. Process Success (status_code 2 = Success)
        if (status_code === '2') {
            if (order_id.startsWith('INV-')) {
                // Handle Invoice Payment
                // New format: INV-{InvoiceId}
                const invoiceId = order_id.replace('INV-', '');

                const invoice = await Invoice.findById(invoiceId);
                if (invoice && invoice.status !== 'paid') {
                    invoice.status = 'paid';
                    invoice.paidAt = new Date();
                    invoice.paidAmount = parseFloat(payhere_amount);
                    invoice.paymentMethod = method || 'PayHere';
                    // Store PayHere specific ID for audit
                    invoice.notes = (invoice.notes ? invoice.notes + '\n' : '') + `PayHere ID: ${payment_id}`;
                    await invoice.save();
                    console.log(`Invoice ${invoice.invoiceNumber} marked as PAID via PayHere`);
                }
            } else if (order_id.startsWith('PLAN-')) {
                // Handle Subscription Upgrade
                // New format: PLAN-{UserId}-{PlanId}
                const parts = order_id.split('-');
                const userId = parts[1];
                const planId = parts[2];

                const user = await User.findById(userId);
                if (user) {
                    user.plan = planId as any;
                    await user.save();
                    console.log(`User ${user.email} upgraded to ${planId} via PayHere`);
                }
            }
        }

        // PayHere expects a 200 OK response
        return new NextResponse('OK', { status: 200 });
    } catch (error: any) {
        console.error('IPN Processing Error:', error);
        return new NextResponse('Error', { status: 500 });
    }
}
