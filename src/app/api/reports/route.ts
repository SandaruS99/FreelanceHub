import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Project from '@/models/Project';
import Client from '@/models/Client';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await dbConnect();

    // Calculate dates for the last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // 1. Monthly Revenue & Analytics
    const monthlyStats = await Invoice.aggregate([
        { 
            $match: { 
                freelancerId: userObjectId, 
                issueDate: { $gte: twelveMonthsAgo } 
            } 
        },
        {
            $group: {
                _id: {
                    year: { $year: '$issueDate' },
                    month: { $month: '$issueDate' }
                },
                revenue: {
                    $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] }
                },
                pending: {
                    $sum: { $cond: [{ $in: ['$status', ['sent', 'viewed', 'overdue']] }, '$total', 0] }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 2. Project Statistics
    const projectStats = await Project.aggregate([
        { $match: { freelancerId: userObjectId } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    // 3. Client Revenue Breakdown (Top 5)
    const clientStats = await Invoice.aggregate([
        { $match: { freelancerId: userObjectId, status: 'paid' } },
        {
            $group: {
                _id: '$clientId',
                revenue: { $sum: '$total' }
            }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'clients',
                localField: '_id',
                foreignField: '_id',
                as: 'client'
            }
        },
        { $unwind: '$client' },
        {
            $project: {
                name: '$client.name',
                revenue: 1
            }
        }
    ]);

    // 4. Summary Totals (All time)
    const [totalRevenue, totalPending] = await Promise.all([
        Invoice.aggregate([
            { $match: { freelancerId: userObjectId, status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]),
        Invoice.aggregate([
            { $match: { freelancerId: userObjectId, status: { $in: ['sent', 'viewed', 'overdue'] } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ])
    ]);

    return NextResponse.json({
        monthly: monthlyStats,
        projects: projectStats,
        clients: clientStats,
        summary: {
            totalRevenue: totalRevenue[0]?.total || 0,
            totalPending: totalPending[0]?.total || 0,
            activeProjects: projectStats.find(p => p._id === 'active')?.count || 0,
            completedProjects: projectStats.find(p => p._id === 'completed')?.count || 0
        }
    });
}
