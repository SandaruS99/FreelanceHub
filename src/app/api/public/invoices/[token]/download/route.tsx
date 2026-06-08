import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import User from '@/models/User';
import Client from '@/models/Client';
import { InvoicePDF } from '@/components/InvoicePDF';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        await dbConnect();

        const invoice = await Invoice.findOne({ publicToken: token })
            .populate({ path: 'freelancerId', select: 'name email businessName businessAddress phone website', model: User })
            .populate({ path: 'clientId', select: 'name company email', model: Client });

        if (!invoice) {
            return new NextResponse('Invoice not found', { status: 404 });
        }

        // Generate PDF buffer
        const pdfBuffer = await renderToBuffer(<InvoicePDF invoice={invoice} />);
        
        const filename = `Invoice_${invoice.invoiceNumber}.pdf`;

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('PDF generation error:', error);
        return new NextResponse('Failed to generate PDF', { status: 500 });
    }
}
