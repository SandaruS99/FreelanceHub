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
        await dbConnect();

        const project = await Project.findOne({ deliveryToken: token }).populate('clientId freelancerId');
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        const merchantId = process.env.PAYHERE_MERCHANT_ID || '';
        const merchantSecret = process.env.PAYHERE_SECRET || '';
        const orderId = project.deliveryToken;
        const amount = project.budget || 0;
        const currency = project.currency || 'USD';

        // MD5 hash (merchant_id + order_id + amount + currency + Upper(md5(merchant_secret)))
        const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
        const amountFormatted = Number(amount).toFixed(2);

        const checkStr = `${merchantId}${orderId}${amountFormatted}${currency}${hashedSecret}`;
        const hash = crypto.createHash('md5').update(checkStr).digest('hex').toUpperCase();

        return NextResponse.json({
            merchant_id: merchantId,
            order_id: orderId,
            items: `Delivery: ${project.name}`,
            amount: amountFormatted,
            currency: currency,
            hash: hash,
            first_name: project.clientId?.name || 'Client',
            last_name: '',
            email: project.clientId?.email || 'client@example.com',
            phone: project.clientId?.whatsapp || '',
            address: 'Colombo, Sri Lanka',
            city: 'Colombo',
            country: 'Sri Lanka',
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/preview/project/${token}?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/preview/project/${token}?cancelled=true`,
            notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/public/projects/${token}/pay/notify`,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
