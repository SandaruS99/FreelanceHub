'use client';

import { useState } from 'react';
import { X, Save, Loader2, AlignLeft, DollarSign, Calendar, Tags, CheckSquare } from 'lucide-react';
import { PROJECT_CATEGORIES, CATEGORY_GROUPS } from '@/lib/projectCategories';

interface EditProjectModalProps {
    project: any;
    onSuccess: (updatedProject: any) => void;
    onClose: () => void;
}

export default function EditProjectModal({ project, onSuccess, onClose }: EditProjectModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Parse dates if they exist
    const formatDate = (dateValue: any) => {
        if (!dateValue) return '';
        const date = new Date(dateValue);
        return date.toISOString().split('T')[0];
    };

    const [form, setForm] = useState({
        name: project.name || '',
        category: project.category || '',
        description: project.description || '',
        status: project.status || 'draft',
        priority: project.priority || 'medium',
        budget: project.budget || '',
        startDate: formatDate(project.startDate),
        endDate: formatDate(project.endDate),
        progress: project.progress || 0,
    });

    const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/projects/${project._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    budget: form.budget ? Number(form.budget) : undefined
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update project');

            onSuccess(data.project);
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
                        <CheckSquare className="w-5 h-5 text-purple-500" />
                        Edit Project Details
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

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Project Name *</label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={(e) => update('name', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                                <div className="relative">
                                    <Tags className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <select
                                        value={form.category}
                                        onChange={(e) => update('category', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition appearance-none"
                                    >
                                        <option value="" className="bg-slate-800 text-slate-500">Select a category...</option>
                                        {CATEGORY_GROUPS.map(group => (
                                            <optgroup key={group} label={group} className="bg-slate-800 text-purple-400 font-semibold">
                                                {PROJECT_CATEGORIES.filter(c => c.group === group).map(c => (
                                                    <option key={c.id} value={c.id} className="text-white font-normal">{c.label}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Total Budget</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="number"
                                        value={form.budget}
                                        onChange={(e) => update('budget', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                            <div className="relative">
                                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) => update('description', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                />
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
                                    <option value="draft" className="bg-slate-800">Draft</option>
                                    <option value="active" className="bg-slate-800">Active</option>
                                    <option value="on-hold" className="bg-slate-800">On-Hold</option>
                                    <option value="completed" className="bg-slate-800">Completed</option>
                                    <option value="cancelled" className="bg-slate-800">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
                                <select
                                    value={form.priority}
                                    onChange={(e) => update('priority', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                >
                                    <option value="low" className="bg-slate-800">Low</option>
                                    <option value="medium" className="bg-slate-800">Medium</option>
                                    <option value="high" className="bg-slate-800">High</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Start Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={(e) => update('startDate', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">End Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        onChange={(e) => update('endDate', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    />
                                </div>
                            </div>
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
                            Update Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
