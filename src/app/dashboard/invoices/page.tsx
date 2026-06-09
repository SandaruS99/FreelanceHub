import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import InvoicesPageClient from '@/components/InvoicesPageClient';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/auth/login');
    }

    const userId = (session.user as { id: string }).id;

    await dbConnect();

    const invoices = await Invoice.find({ freelancerId: userId })
        .populate('clientId', 'name company')
        .sort({ createdAt: -1 })
        .lean();

    const serializedInvoices = JSON.parse(JSON.stringify(invoices));

    return <InvoicesPageClient initialInvoices={serializedInvoices} />;
}
