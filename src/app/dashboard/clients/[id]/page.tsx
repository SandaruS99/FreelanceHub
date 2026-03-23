'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Building2, Mail, Phone, MapPin, Globe, Loader2,
    Trash2, Edit, Calendar, CheckSquare, FileText, Plus
} from 'lucide-react';

interface Client {
    _id: string;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    address?: string;
    country?: string;
    website?: string;
    status: string;
    notes?: string;
    tags: string[];
    createdAt: string;
}

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetch(`/api/clients/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.client) setClient(data.client);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this client? This will not delete their projects or invoices.')) return;
        setDeleting(true);
        await fetch(`/api/clients/${id}`, { method: 'DELETE' });
        router.push('/dashboard/clients');
        router.refresh();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white mb-2">Client Not Found</h2>
                <Link href="/dashboard/clients" className="text-purple-400 hover:text-purple-300">
                    Back to Clients
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/clients"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white">{client.name}</h1>
                            <span className={`text-xs px-2.5 py-0.5 rounded capitalize ${client.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'} border`}>
                                {client.status}
                            </span>
                        </div>
                        {client.company && (
                            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                                <Building2 className="w-4 h-4" /> {client.company}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl transition text-sm font-medium">
                        <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 px-4 py-2 rounded-xl transition text-sm font-medium"
                    >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Info & Notes */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                        <div className="space-y-4">
                            {client.email && (
                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-300">Email Address</p>
                                        <a href={`mailto:${client.email}`} className="text-purple-400 hover:text-purple-300 text-sm">{client.email}</a>
                                    </div>
                                </div>
                            )}
                            {client.phone && (
                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-300">Phone</p>
                                        <a href={`tel:${client.phone}`} className="text-slate-400 hover:text-white text-sm">{client.phone}</a>
                                    </div>
                                </div>
                            )}
                            {client.website && (
                                <div className="flex items-start gap-3">
                                    <Globe className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-300">Website</p>
                                        <a href={client.website} target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">{client.website}</a>
                                    </div>
                                </div>
                            )}
                            {client.address && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-300">Location</p>
                                        <p className="text-slate-400 text-sm">{client.address}</p>
                                        {client.country && <p className="text-slate-400 text-sm">{client.country}</p>}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-slate-300">Added On</p>
                                    <p className="text-slate-400 text-sm">{new Date(client.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {client.tags.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <p className="text-sm font-medium text-slate-300 mb-3">Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {client.tags.map(tag => (
                                        <span key={tag} className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Internal Notes</h3>
                        {client.notes ? (
                            <p className="text-slate-400 text-sm whitespace-pre-wrap leading-relaxed">{client.notes}</p>
                        ) : (
                            <p className="text-slate-500 text-sm italic">No notes added for this client.</p>
                        )}
                    </div>
                </div>

                {/* Right Column: Related Data (Projects, Invoices) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Projects Quick View */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-purple-400" /> Recent Projects
                            </h3>
                            <Link href={`/dashboard/projects/new?client=${client._id}`} className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1">
                                <Plus className="w-4 h-4" /> New Project
                            </Link>
                        </div>

                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                            <p className="text-slate-400 text-sm">No projects found for this client.</p>
                        </div>
                    </div>

                    {/* Invoices Quick View */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-400" /> Recent Invoices
                            </h3>
                            <Link href={`/dashboard/invoices/new?client=${client._id}`} className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1">
                                <Plus className="w-4 h-4" /> New Invoice
                            </Link>
                        </div>

                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                            <p className="text-slate-400 text-sm">No invoices found for this client.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
