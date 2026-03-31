'use client';

import { useState } from 'react';
import { X, Save, Loader2, Building2, Mail, Phone, MapPin, Globe, Tags } from 'lucide-react';
import { CLIENT_LABELS } from '@/lib/clientLabels';

interface EditClientModalProps {
    client: any;
    onSuccess: (updatedClient: any) => void;
    onClose: () => void;
}

export default function EditClientModal({ client, onSuccess, onClose }: EditClientModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: client.name || '',
        company: client.company || '',
        email: client.email || '',
        phone: client.phone || '',
        whatsapp: client.whatsapp || '',
        address: client.address || '',
        country: client.country || '',
        website: client.website || '',
        status: client.status || 'active',
        notes: client.notes || '',
        tags: client.tags || [],
    });

    const toggleTag = (labelName: string) => {
        if (form.tags.includes(labelName)) {
            setForm({ ...form, tags: form.tags.filter((t: string) => t !== labelName) });
        } else {
            setForm({ ...form, tags: [...form.tags, labelName] });
        }
    };

    const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/clients/${client._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update client');

            onSuccess(data.client);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl my-auto scale-in">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02] sticky top-0 z-10 backdrop-blur-md">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Edit className="w-5 h-5 text-purple-500" />
                        Edit Client Profile
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name *</label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={(e) => update('name', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Company</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    value={form.company}
                                    onChange={(e) => update('company', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => update('email', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => update('phone', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">WhatsApp Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 text-purple-400" />
                                <input
                                    type="tel"
                                    value={form.whatsapp}
                                    onChange={(e) => update('whatsapp', e.target.value)}
                                    className="w-full bg-purple-500/5 border border-purple-500/20 rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                            <select
                                value={form.status}
                                onChange={(e) => update('status', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                            >
                                <option value="active" className="bg-slate-800">Active</option>
                                <option value="inactive" className="bg-slate-800">Inactive</option>
                                <option value="archived" className="bg-slate-800">Archived</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Website</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="url"
                                    value={form.website}
                                    onChange={(e) => update('website', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <label className="block text-sm font-medium text-slate-300 mb-3">Client Labels</label>
                        <div className="space-y-4">
                            {(['Lifecycle', 'Financial', 'Management'] as const).map(category => (
                                <div key={category}>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{category}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {CLIENT_LABELS.filter(l => l.category === category).map((label) => {
                                            const isSelected = form.tags.includes(label.label);
                                            return (
                                                <button
                                                    key={label.id}
                                                    type="button"
                                                    onClick={() => toggleTag(label.label)}
                                                    className={`text-[11px] px-2.5 py-1 rounded border transition-all ${
                                                        isSelected 
                                                            ? label.colorClass 
                                                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-300'
                                                    }`}
                                                >
                                                    {label.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white text-sm font-bold shadow-lg shadow-purple-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Update Client
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import { Edit } from 'lucide-react';
