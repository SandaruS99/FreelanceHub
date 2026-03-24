import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import { auth } from '@/lib/auth';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    await dbConnect();
    const invoice = await Invoice.findOne({ _id: id, freelancerId: userId }).populate('clientId', 'name email phone');

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (!invoice.clientId?.email) return NextResponse.json({ error: 'Client has no email address' }, { status: 400 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentLink = `${appUrl}/preview/invoice/${invoice.publicToken}/pay`;

    // Generate WhatsApp link if phone exists
    let whatsappUrl = null;
    if (invoice.clientId?.phone) {
        const message = `Hello ${invoice.clientId.name}, here is your invoice #${invoice.invoiceNumber} from ${session.user.name || 'Freelancer'}. \n\nTotal: $${(invoice.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}\n\nYou can pay securely here: ${paymentLink}\n\nThank you!`;
        const encodedMessage = encodeURIComponent(message);
        const cleanPhone = invoice.clientId.phone.replace(/\D/g, ''); // Remove non-digits
        whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    }

    try {
        // Only send if we have a real key, otherwise mock success locally
        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: 'FreelanceHub <onboarding@resend.dev>',
                to: invoice.clientId.email,
                subject: `New Invoice ${invoice.invoiceNumber} from ${session.user.name || 'Freelancer'}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #333333;">
                        
                        <!-- Header -->
                        <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
                            <h1 style="color: #111827; margin: 0; font-size: 28px;">INVOICE</h1>
                            <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">#${invoice.invoiceNumber}</p>
                        </div>

                        <!-- Info Grid -->
                        <table style="width: 100%; margin-bottom: 30px; font-size: 14px;">
                            <tr>
                                <td style="vertical-align: top; width: 50%;">
                                    <p style="margin: 0; color: #6b7280; font-weight: bold; text-transform: uppercase;">Billed To:</p>
                                    <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 16px;">${invoice.clientId.name}</p>
                                    ${invoice.clientId.company ? `<p style="margin: 2px 0 0 0;">${invoice.clientId.company}</p>` : ''}
                                    <p style="margin: 2px 0 0 0; color: #6b7280;">${invoice.clientId.email}</p>
                                </td>
                                <td style="vertical-align: top; width: 50%; text-align: right;">
                                    <p style="margin: 0;"><span style="color: #6b7280; font-weight: bold;">Issue Date:</span> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
                                    <p style="margin: 5px 0 0 0;"><span style="color: #6b7280; font-weight: bold;">Due Date:</span> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
                                    <p style="margin: 15px 0 0 0; font-size: 18px;"><span style="color: #6b7280; font-weight: bold; font-size: 14px;">Amount Due:</span><br/><strong>$${(invoice.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></p>
                                </td>
                            </tr>
                        </table>

                        <!-- Line Items -->
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
                            <thead>
                                <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                                    <th style="padding: 10px; text-align: left; color: #4b5563;">Description</th>
                                    <th style="padding: 10px; text-align: right; color: #4b5563;">Rate</th>
                                    <th style="padding: 10px; text-align: right; color: #4b5563;">Qty</th>
                                    <th style="padding: 10px; text-align: right; color: #4b5563;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoice.lineItems.map((item: any) => `
                                    <tr style="border-bottom: 1px solid #e5e7eb;">
                                        <td style="padding: 10px;">${item.description}</td>
                                        <td style="padding: 10px; text-align: right;">$${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td style="padding: 10px; text-align: right;">${item.quantity}</td>
                                        <td style="padding: 10px; text-align: right; font-weight: bold;">$${(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <!-- Totals -->
                        <table style="width: 100%; font-size: 14px; margin-bottom: 30px;">
                            <tr>
                                <td style="width: 50%;">
                                    ${invoice.notes ? `<p style="color: #6b7280; font-size: 12px; margin: 0;"><strong>Notes:</strong><br/>${invoice.notes}</p>` : ''}
                                </td>
                                <td style="width: 50%;">
                                    <table style="width: 100%; border-collapse: collapse;">
                                        <tr>
                                            <td style="padding: 5px 10px; color: #6b7280;">Subtotal:</td>
                                            <td style="padding: 5px 10px; text-align: right; font-weight: bold;">$${(invoice.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                        ${invoice.taxTotal > 0 ? `
                                            <tr>
                                                <td style="padding: 5px 10px; color: #6b7280;">Tax:</td>
                                                <td style="padding: 5px 10px; text-align: right; font-weight: bold;">$${invoice.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ` : ''}
                                        ${invoice.discount > 0 ? `
                                            <tr>
                                                <td style="padding: 5px 10px; color: #6b7280;">Discount:</td>
                                                <td style="padding: 5px 10px; text-align: right; font-weight: bold;">-$${invoice.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ` : ''}
                                        <tr style="border-top: 2px solid #e5e7eb;">
                                            <td style="padding: 10px; font-weight: bold; font-size: 16px;">Total Due:</td>
                                            <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; color: #8b5cf6;">$${(invoice.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <!-- Pay Button Action -->
                        <div style="text-align: center; margin: 40px 0; background: #f4f4f5; padding: 30px; border-radius: 8px;">
                            <p style="margin: 0 0 15px 0; font-size: 16px;">This invoice can be paid securely online via Credit Card or Bank Transfer.</p>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/invoice/${invoice.publicToken}/pay" 
                               style="display: inline-block; padding: 14px 32px; background-color: #8b5cf6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Pay Now $${(invoice.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </a>
                            <div style="margin-top: 20px;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/public/invoices/${invoice.publicToken}/download"
                                   style="color: #6b7280; font-size: 14px; text-decoration: underline;">
                                    Download as PDF
                                </a>
                            </div>
                        </div>
                        
                        <p style="text-align: center; color: #9ca3af; font-size: 12px;">Thank you for your business. Powered by FreelanceHub.</p>
                    </div>
                `,
            });
        } else {
            console.log(`[MOCK EMAIL] Sent to ${invoice.clientId.email} for invoice ${invoice.invoiceNumber}`);
        }

        invoice.status = 'sent';
        invoice.sentAt = new Date();
        await invoice.save();

        return NextResponse.json({
            success: true,
            message: 'Invoice sent successfully',
            invoice,
            whatsappUrl // Return to frontend to open in new tab
        });
    } catch (error) {
        console.error('Email error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
