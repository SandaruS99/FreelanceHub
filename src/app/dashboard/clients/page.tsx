'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Mail, Phone, Building2, MoreVertical, Loader2, ArrowRight } from 'lucide-react';
import { getLabelColorClass } from '@/lib/clientLabels';

interface Client {
    _id: string;
    clientNumber?: string;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    status: string;
    tags: string[];
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchClients = useCallback(async () => {
        setLoading(true);
        const res = await fetch(`/api/clients?search=${search}`);
        const data = await res.json();
        setClients(data.clients ?? []);
        setLoading(false);
    }, [search]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchClients();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [search, fetchClients]);

    const statusColors: Record<string, string> = {
        active: 'bg-green-500/20 text-green-400 border-green-500/30',
        inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        archived: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Clients</h1>
                    <p className="text-slate-400 mt-1">Manage your professional network and contacts.</p>
                </div>
                <Link
                    href="/dashboard/clients/new"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl transition shadow-lg shadow-purple-500/30"
                >
                    <Plus className="w-5 h-5" />
                    Add Client
                </Link>
            </div>

            {/* Toolbar */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search clients by name, company, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
            ) : clients.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                        <Users className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No clients found</h3>
                    <p className="text-slate-400 max-w-sm mx-auto mb-6">
                        {search ? 'No clients match your search criteria.' : 'Add your first client to start organizing your contacts and projects.'}
                    </p>
                    {!search && (
                        <Link
                            href="/dashboard/clients/new"
                            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-2.5 rounded-xl transition"
                        >
                            <Plus className="w-4 h-4" /> Add Client
                        </Link>
                    )}
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-white/[0.02] border-b border-white/10 text-slate-300">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Client ID</th>
                                    <th className="px-6 py-4 font-medium">Client</th>
                                    <th className="px-6 py-4 font-medium">Contact</th>
                                    <th className="px-6 py-4 font-medium">Labels</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {clients.map((client) => (
                                    <tr key={client._id} className="hover:bg-white/[0.02] transition group">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {client.clientNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold opacity-90 shrink-0 text-xs">
                                                    {client.name[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{client.name}</div>
                                                    {client.company && (
                                                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                            <Building2 className="w-3 h-3" /> {client.company}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 space-y-1">
                                            {client.email && (
                                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    <span className="truncate max-w-[150px]">{client.email}</span>
                                                </div>
                                            )}
                                            {client.phone && (
                                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    <span className="truncate">{client.phone}</span>
                                                </div>
                                            )}
                                            {!client.email && !client.phone && <span className="text-slate-600 italic">No contact info</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {client.tags && client.tags.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {client.tags.map(tag => (
                                                        <span key={tag} className={`px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider font-bold whitespace-nowrap ${getLabelColorClass(tag)}`}>
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 italic text-xs">None</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border capitalize ${statusColors[client.status]}`}>
                                                {client.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/dashboard/clients/${client._id}`} className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium">
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

// Ensure lucide icon Users is imported for empty state
import { Users } from 'lucide-react';
