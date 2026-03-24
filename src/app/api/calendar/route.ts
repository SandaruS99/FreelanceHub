import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Invoice from '@/models/Invoice';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await dbConnect();

    // Fetch all date-relevant items in parallel
    const [projects, tasks, invoices] = await Promise.all([
        Project.find({ freelancerId: userObjectId, deadline: { $exists: true } }).select('name deadline status priority').lean(),
        Task.find({ freelancerId: userObjectId, dueDate: { $exists: true } }).select('title dueDate status priority').lean(),
        Invoice.find({ freelancerId: userObjectId, dueDate: { $exists: true } }).select('invoiceNumber dueDate status total').lean()
    ]);

    // Unify into a calendar event format
    const events = [
        ...projects.map((p: any) => ({
            id: p._id,
            title: p.name,
            date: p.deadline,
            type: 'project',
            status: p.status,
            priority: p.priority,
            url: `/dashboard/projects/${p._id}`
        })),
        ...tasks.map((t: any) => ({
            id: t._id,
            title: t.title,
            date: t.dueDate,
            type: 'task',
            status: t.status,
            priority: t.priority,
            url: `/dashboard/tasks`
        })),
        ...invoices.map((i: any) => ({
            id: i._id,
            title: `Invoice ${i.invoiceNumber}`,
            date: i.dueDate,
            type: 'invoice',
            status: i.status,
            amount: i.total,
            url: `/dashboard/invoices/${i._id}`
        }))
    ];

    return NextResponse.json({ events });
}
