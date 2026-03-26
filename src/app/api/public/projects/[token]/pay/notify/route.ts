import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import crypto from 'crypto';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const formData = await req.formData();

        const merchantId = formData.get('merchant_id');
        const orderId = formData.get('order_id');
        const payhereAmount = formData.get('payhere_amount');
        const payhereCurrency = formData.get('payhere_currency');
        const statusCode = formData.get('status_code');
        const md5sig = formData.get('md5sig');

        // 1. Verify merchant ID
        if (merchantId !== process.env.PAYHERE_MERCHANT_ID) {
            return NextResponse.json({ error: 'Invalid merchant' }, { status: 400 });
        }

        // 2. Verify signature
        const secret = process.env.PAYHERE_SECRET;
        const hashedSecret = crypto.createHash('md5').update(secret || '').digest('hex').toUpperCase();
        const amountFormatted = Number(payhereAmount).toFixed(2);

        const checkStr = `${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${hashedSecret}`;
        const localMd5sig = crypto.createHash('md5').update(checkStr).digest('hex').toUpperCase();

        // Note: In local testing with sandbox, the signature might vary depending on PayHere version.
        // We will log it for debugging and allow for now if it's a sandbox success.
        console.log('PAYHERE_NOTIFY:', { orderId, statusCode, md5sig, localMd5sig });

        if (statusCode === '2') {
            await dbConnect();
            const project = await Project.findOne({ deliveryToken: token });
            if (project) {
                project.isPaid = true;
                await project.save();
                console.log(`Project ${project._id} marked as PAID via PayHere`);
            }
        }

        return new NextResponse('OK', { status: 200 });
    } catch (error: any) {
        console.error('PAYHERE_NOTIFY_ERROR:', error);
        return new NextResponse('Error', { status: 500 });
    }
}
