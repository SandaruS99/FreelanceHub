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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [clients, projects, openTasks, invoiceAgg] = await Promise.all([
        Client.countDocuments({ freelancerId: userObjectId }),
        Project.countDocuments({ freelancerId: userObjectId }),
        Task.countDocuments({ freelancerId: userObjectId, status: { $ne: 'done' } }),
        Invoice.aggregate([
            { $match: { freelancerId: userObjectId } },
            { $group: {
                _id: { status: '$status', currency: '$currency' },
                count: { $sum: 1 },
                totalAmount: { $sum: '$total' },
                thisMonthAmount: {
                    $sum: {
                        $cond: [
                            { $gte: ['$issueDate', startOfMonth] },
                            '$total',
                            0
                        ]
                    }
                }
            }}
        ]),
    ]);

    // Fetch exchange rates to handle multi-currency invoices
    let rates: Record<string, number> = { USD: 1 };
    try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', { next: { revalidate: 3600 } });
        if (res.ok) {
            const data = await res.json();
            if (data.rates) rates = data.rates;
        }
    } catch (error) {
        rates = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.1, LKR: 310, AUD: 1.53, CAD: 1.36 };
    }

    const userCurrency = (session.user as any).currency || 'USD';
    const userRate = rates[userCurrency] || 1;

    // Process invoice aggregation
    let totalInvoices = 0;
    let pendingInvoices = 0;
    let paidInvoices = 0;
    let pendingAmount = 0;
    let revenueThisMonth = 0;

    invoiceAgg.forEach((item: { _id: { status: string; currency: string }; count: number; totalAmount: number; thisMonthAmount: number }) => {
        totalInvoices += item.count;
        
        const invoiceCurrency = item._id.currency || 'USD';
        const invoiceRate = rates[invoiceCurrency] || 1;
        
        // Convert to USD first, then to the user's preferred currency
        const toUsdRatio = 1 / invoiceRate;
        const conversionRatio = toUsdRatio * userRate;

        const convertedTotalAmount = item.totalAmount * conversionRatio;
        const convertedThisMonthAmount = item.thisMonthAmount * conversionRatio;

        if (['sent', 'viewed', 'overdue'].includes(item._id.status)) {
            pendingInvoices += item.count;
            pendingAmount += convertedTotalAmount;
        } else if (item._id.status === 'paid') {
            paidInvoices += item.count;
            revenueThisMonth += convertedThisMonthAmount;
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
            pendingAmount,
            revenueThisMonth,
        },
    });
}
