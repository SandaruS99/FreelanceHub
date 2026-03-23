'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
    Users, FolderKanban, CheckSquare, FileText, DollarSign, Clock, TrendingUp, Plus, ArrowRight
} from 'lucide-react';

interface Stats {
    clients: number;
    projects: number;
    tasks: number;
    invoices: { total: number; pending: number; paid: number };
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const user = session?.user as { name?: string } | undefined;
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/clients?limit=1').then((r) => r.json()),
            fetch('/api/projects').then((r) => r.json()),
            fetch('/api/tasks').then((r) => r.json()),
            fetch('/api/invoices').then((r) => r.json()),
        ]).then(([c, p, t, i]) => {
            const invoices = i.invoices ?? [];
            setStats({
                clients: c.total ?? 0,
                projects: (p.projects ?? []).length,
                tasks: (t.tasks ?? []).filter((task: { status: string }) => task.status !== 'done').length,
                invoices: {
                    total: invoices.length,
                    pending: invoices.filter((inv: { status: string }) => ['sent', 'viewed', 'overdue'].includes(inv.status)).length,
                    paid: invoices.filter((inv: { status: string }) => inv.status === 'paid').length,
                },
            });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    const statCards = [
        { label: 'Total Clients', value: stats?.clients ?? 0, icon: Users, href: '/dashboard/clients', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { label: 'Active Projects', value: stats?.projects ?? 0, icon: FolderKanban, href: '/dashboard/projects', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        { label: 'Open Tasks', value: stats?.tasks ?? 0, icon: CheckSquare, href: '/dashboard/tasks', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { label: 'Pending Invoices', value: stats?.invoices.pending ?? 0, icon: FileText, href: '/dashboard/invoices', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
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
                    {greeting}, {user?.name?.split(' ')[0] ?? 'there'}! 👋
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
                        <p className="text-3xl font-bold text-white">{loading ? '—' : value}</p>
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
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Total Invoices', value: stats?.invoices.total ?? 0, icon: FileText, color: 'text-blue-400' },
                            { label: 'Pending Payment', value: stats?.invoices.pending ?? 0, icon: Clock, color: 'text-amber-400' },
                            { label: 'Paid', value: stats?.invoices.paid ?? 0, icon: DollarSign, color: 'text-green-400' },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="bg-white/5 rounded-xl p-4 text-center">
                                <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
                                <p className="text-2xl font-bold text-white">{loading ? '—' : value}</p>
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
