import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Client from '@/models/Client';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Invoice from '@/models/Invoice';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    await dbConnect();

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [clients, projects, openTasks, invoiceAgg] = await Promise.all([
        Client.countDocuments({ freelancerId: userObjectId }),
        Project.countDocuments({ freelancerId: userObjectId }),
        Task.countDocuments({ freelancerId: userObjectId, status: { $ne: 'done' } }),
        Invoice.aggregate([
            { $match: { freelancerId: userObjectId } },
            { $group: {
                _id: '$status',
                count: { $sum: 1 }
            }}
        ]),
    ]);

    // Process invoice aggregation
    let totalInvoices = 0;
    let pendingInvoices = 0;
    let paidInvoices = 0;

    invoiceAgg.forEach((item: { _id: string; count: number }) => {
        totalInvoices += item.count;
        if (['sent', 'viewed', 'overdue'].includes(item._id)) {
            pendingInvoices += item.count;
        } else if (item._id === 'paid') {
            paidInvoices += item.count;
        }
    });

    return NextResponse.json({
        clients,
        projects,
        tasks: openTasks,
        invoices: {
            total: totalInvoices,
            pending: pendingInvoices,
            paid: paidInvoices,
        },
    });
}
