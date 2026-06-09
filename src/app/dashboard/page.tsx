export const dynamic = 'force-dynamic';

import Link from 'next/link';
import mongoose from 'mongoose';
import {
    Users, FolderKanban, CheckSquare, FileText, DollarSign, Clock, TrendingUp, Plus, ArrowRight
} from 'lucide-react';

import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Client from '@/models/Client';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Invoice from '@/models/Invoice';
import { redirect } from 'next/navigation';
import { formatAmount } from '@/lib/formatCurrency';

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) redirect('/auth/login');

    const userId = (session.user as { id: string }).id;
    const userName = session.user.name;
    const userCurrency = (session.user as any).currency || 'USD';

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

    const stats = {
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
    };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    const statCards = [
        { label: 'Total Clients', value: stats.clients, icon: Users, href: '/dashboard/clients', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { label: 'Active Projects', value: stats.projects, icon: FolderKanban, href: '/dashboard/projects', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        { label: 'Open Tasks', value: stats.tasks, icon: CheckSquare, href: '/dashboard/tasks', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { label: 'Pending Invoices', value: stats.invoices.pending, icon: FileText, href: '/dashboard/invoices', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    ];

    const quickActions = [
        { label: 'New Client', href: '/dashboard/clients/new', icon: Users },
        { label: 'New Project', href: '/dashboard/projects/new', icon: FolderKanban },
        { label: 'New Task', href: '/dashboard/tasks/new', icon: CheckSquare },
        { label: 'New Invoice', href: '/dashboard/invoices/new', icon: FileText },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            {/* Greeting */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">
                    {greeting}, {userName?.split(' ')[0] ?? 'there'}! 👋
                </h1>
                <p className="text-slate-400 mt-1">Here&apos;s what&apos;s happening with your business today.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map(({ label, value, icon: Icon, href, color, bg, border }) => (
                    <Link
                        key={label}
                        href={href}
                        className={`${bg} ${border} border rounded-2xl p-5 hover:scale-105 transition-transform duration-200 group`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-400 text-xs font-medium">{label}</span>
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white">{value}</p>
                        <p className="text-xs text-slate-500 mt-1 group-hover:text-slate-400 transition flex items-center gap-1">
                            View all <ArrowRight className="w-3 h-3" />
                        </p>
                    </Link>
                ))}
            </div>

            {/* Quick Actions + Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-purple-400" /> Quick Actions
                    </h2>
                    <div className="space-y-2">
                        {quickActions.map(({ label, href, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/30 text-slate-300 hover:text-white text-sm font-medium transition-all group"
                            >
                                <Icon className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition" />
                                {label}
                                <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-600 group-hover:text-purple-400 transition" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Revenue Overview */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" /> Invoice Overview
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Revenue (This Month)', value: formatAmount(stats.invoices.revenueThisMonth, userCurrency), icon: TrendingUp, color: 'text-green-400' },
                            { label: 'Pending Amount', value: formatAmount(stats.invoices.pendingAmount, userCurrency), icon: Clock, color: 'text-amber-400' },
                            { label: 'Total Invoices', value: stats.invoices.total, icon: FileText, color: 'text-blue-400' },
                            { label: 'Paid Invoices', value: stats.invoices.paid, icon: CheckSquare, color: 'text-purple-400' },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="bg-white/5 rounded-xl p-4 text-center">
                                <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
                                <p className="text-xl font-bold text-white">{value}</p>
                                <p className="text-slate-400 text-xs mt-1">{label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6">
                        <Link href="/dashboard/invoices" className="text-sm text-purple-400 hover:text-purple-300 transition flex items-center gap-1">
                            View all invoices <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
