'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, XCircle, Clock, Loader2, RefreshCw, Trash2 } from 'lucide-react';

interface Freelancer {
    _id: string;
    userId?: string;
    name: string;
    email: string;
    status: 'pending' | 'active' | 'suspended';
    businessName?: string;
    plan: string;
    createdAt: string;
}

const statusConfig = {
    active: { label: 'Active', class: 'bg-green-500/20 text-green-400 border-green-500/30' },
    pending: { label: 'Pending', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    suspended: { label: 'Suspended', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function FreelancersPage() {
    const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    const fetchFreelancers = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ limit: '50' });
        if (statusFilter) params.set('status', statusFilter);
        const res = await fetch(`/api/admin/freelancers?${params}`);
        const data = await res.json();
        setFreelancers(data.users ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
    }, [statusFilter]);

    useEffect(() => { fetchFreelancers(); }, [fetchFreelancers]);

    const changeStatus = async (id: string, status: string) => {
        setActionLoading(id + status);
        await fetch(`/api/admin/freelancers/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        setActionLoading(null);
        fetchFreelancers();
    };

    const deleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to permanently delete this account?')) return;
        setActionLoading(id + 'delete');
        await fetch(`/api/admin/freelancers/${id}`, { method: 'DELETE' });
        setActionLoading(null);
        fetchFreelancers();
    };

    const filtered = freelancers.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.email.toLowerCase().includes(search.toLowerCase()) ||
        (f.userId && f.userId.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Freelancers</h1>
                <p className="text-slate-400 mt-1">{total} total registered freelancers</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[140px]"
                >
                    <option value="" className="bg-slate-800">All Status</option>
                    <option value="pending" className="bg-slate-800">Pending</option>
                    <option value="active" className="bg-slate-800">Active</option>
                    <option value="suspended" className="bg-slate-800">Suspended</option>
                </select>
                <button onClick={fetchFreelancers} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-sm transition">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left text-xs font-medium text-slate-400 px-6 py-4">UID</th>
                                <th className="text-left text-xs font-medium text-slate-400 px-6 py-4">FREELANCER</th>
                                <th className="text-left text-xs font-medium text-slate-400 px-6 py-4 hidden md:table-cell">BUSINESS</th>
                                <th className="text-left text-xs font-medium text-slate-400 px-6 py-4">STATUS</th>
                                <th className="text-left text-xs font-medium text-slate-400 px-6 py-4 hidden lg:table-cell">PLAN</th>
                                <th className="text-left text-xs font-medium text-slate-400 px-6 py-4 hidden lg:table-cell">JOINED</th>
                                <th className="text-right text-xs font-medium text-slate-400 px-6 py-4">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-12 text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-slate-500">No freelancers found.</td></tr>
                            ) : filtered.map((f) => (
                                <tr key={f._id} className="hover:bg-white/5 transition">
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono text-purple-400 font-medium">{f.userId || '—'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                                                {f.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">{f.name}</p>
                                                <p className="text-slate-400 text-xs">{f.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell text-slate-400 text-sm">{f.businessName ?? '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusConfig[f.status].class}`}>
                                            {statusConfig[f.status].label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 hidden lg:table-cell">
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 capitalize">{f.plan}</span>
                                    </td>
                                    <td className="px-6 py-4 hidden lg:table-cell text-slate-400 text-xs">
                                        {new Date(f.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {f.status !== 'active' && (
                                                <button
                                                    onClick={() => changeStatus(f._id, 'active')}
                                                    disabled={!!actionLoading}
                                                    title="Approve"
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition disabled:opacity-50"
                                                >
                                                    {actionLoading === f._id + 'active' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                                </button>
                                            )}
                                            {f.status !== 'suspended' && (
                                                <button
                                                    onClick={() => changeStatus(f._id, 'suspended')}
                                                    disabled={!!actionLoading}
                                                    title="Suspend"
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition disabled:opacity-50"
                                                >
                                                    {actionLoading === f._id + 'suspended' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteUser(f._id)}
                                                disabled={!!actionLoading}
                                                title="Delete"
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                                            >
                                                {actionLoading === f._id + 'delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
