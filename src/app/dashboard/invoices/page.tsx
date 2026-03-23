'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText, Download, Loader2, ArrowRight } from 'lucide-react';

interface Invoice {
    _id: string;
    invoiceNumber: string;
    clientId?: { _id: string; name: string; company?: string };
    issueDate: string;
    dueDate: string;
    total: number;
    status: string;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        let url = `/api/invoices`;
        if (statusFilter !== 'all') {
            url += `?status=${statusFilter}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setInvoices(data.invoices ?? []);
        setLoading(false);
    }, [statusFilter]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const filteredInvoices = invoices.filter(i =>
        i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        i.clientId?.name.toLowerCase().includes(search.toLowerCase())
    );

    const statusColors: Record<string, string> = {
        draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        paid: 'bg-green-500/20 text-green-400 border-green-500/30',
        overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
        cancelled: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Invoices</h1>
                    <p className="text-slate-400 mt-1">Manage billing, track payments, and get paid faster.</p>
                </div>
                <Link
                    href="/dashboard/invoices/new"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl transition shadow-lg shadow-purple-500/30"
                >
                    <Plus className="w-5 h-5" />
                    Create Invoice
                </Link>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search invoice number or client..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[150px]"
                >
                    <option value="all" className="bg-slate-800">All Statuses</option>
                    <option value="draft" className="bg-slate-800">Draft</option>
                    <option value="sent" className="bg-slate-800">Sent</option>
                    <option value="paid" className="bg-slate-800">Paid</option>
                    <option value="overdue" className="bg-slate-800">Overdue</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                        <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No invoices found</h3>
                    <p className="text-slate-400 max-w-sm mx-auto mb-6">
                        Create your first invoice to bill a client and track payments.
                    </p>
                    <Link
                        href="/dashboard/invoices/new"
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-2.5 rounded-xl transition"
                    >
                        <Plus className="w-4 h-4" /> Create Invoice
                    </Link>
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-white/[0.02] border-b border-white/10 text-slate-300">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Invoice</th>
                                    <th className="px-6 py-4 font-medium">Client</th>
                                    <th className="px-6 py-4 font-medium">Amount</th>
                                    <th className="px-6 py-4 font-medium">Issued / Due</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredInvoices.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-white/[0.02] transition group">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {invoice.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            {invoice.clientId ? (
                                                <span className="text-white hover:text-purple-400 transition cursor-pointer">
                                                    {invoice.clientId.name}
                                                </span>
                                            ) : (
                                                <span className="italic">Unknown Client</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">
                                            ${(invoice.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white">{new Date(invoice.issueDate).toLocaleDateString()}</div>
                                            <div className="text-xs mt-0.5">Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded capitalize border ${statusColors[invoice.status]}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/dashboard/invoices/${invoice._id}`} className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium">
                                                    View <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
