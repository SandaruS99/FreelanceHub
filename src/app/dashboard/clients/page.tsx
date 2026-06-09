import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Client from '@/models/Client';
import ClientsPageClient from '@/components/ClientsPageClient';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/auth/login');
    }

    const userId = (session.user as { id: string }).id;

    await dbConnect();

    const clients = await Client.find({ freelancerId: userId })
        .sort({ createdAt: -1 })
        .lean();

    const serializedClients = JSON.parse(JSON.stringify(clients));

    return <ClientsPageClient initialClients={serializedClients} />;
}
