import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import User from '@/models/User';
import Client from '@/models/Client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        await dbConnect();

        // We need to populate freelancer (User) and Client to get their names
        const invoice = await Invoice.findOne({ publicToken: token })
            .populate({ path: 'freelancerId', select: 'name email', model: User })
            .populate({ path: 'clientId', select: 'name email company', model: Client });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Return only safe public data needed for the payment page
        const publicData = {
            _id: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            total: invoice.total,
            status: invoice.status,
            currency: invoice.currency,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            freelancer: {
                name: invoice.freelancerId.name,
                email: invoice.freelancerId.email,
            },
            client: {
                name: invoice.clientId.name,
                company: invoice.clientId.company,
                email: invoice.clientId.email,
            }
        };

        return NextResponse.json({ invoice: publicData });
    } catch (error) {
        console.error('Error fetching public invoice:', error);
        return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
    }
}
