'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Calendar, Loader2, DollarSign, AlignLeft, Plus, Trash2, ListChecks } from 'lucide-react';

interface Client {
    _id: string;
    name: string;
}

interface TaskForm {
    title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
}

function ProjectForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedClient = searchParams.get('client');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [clients, setClients] = useState<Client[]>([]);

    const [form, setForm] = useState({
        name: '',
        clientId: preSelectedClient || '',
        description: '',
        status: 'draft',
        priority: 'medium',
        startDate: '',
        endDate: '',
        budget: '',
        progress: 0,
    });

    const [tasks, setTasks] = useState<TaskForm[]>([
        { title: '', priority: 'medium' }
    ]);

    useEffect(() => {
        fetch('/api/clients')
            .then((res) => res.json())
            .then((data) => setClients(data.clients || []))
            .catch((err) => console.error(err));
    }, []);

    const update = (key: string, value: string | number) => setForm((f) => ({ ...f, [key]: value }));

    const addTask = () => setTasks([...tasks, { title: '', priority: 'medium' }]);
    const removeTask = (index: number) => setTasks(tasks.filter((_, i) => i !== index));
    const updateTask = (index: number, key: keyof TaskForm, value: string) => {
        const newTasks = [...tasks];
        newTasks[index] = { ...newTasks[index], [key]: value };
        setTasks(newTasks);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Filter out empty tasks
        const validTasks = tasks.filter(t => t.title.trim() !== '');

        // Format budget to number if provided
        const payload = {
            ...form,
            budget: form.budget ? Number(form.budget) : undefined,
            tasks: validTasks
        };

        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create project');
            }

            router.push('/dashboard/projects');
            router.refresh();
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/projects"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Create New Project</h1>
                        <p className="text-slate-400 text-sm mt-1">Start tracking a new deliverable or retainer.</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading || !form.name}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Project
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 transition shrink-0">&times;</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-6 border-b border-white/5 pb-4">Project Details</h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Project Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => update('name', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                    placeholder="Website Redesign 2024"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Assign Client</label>
                                <select
                                    value={form.clientId}
                                    onChange={(e) => update('clientId', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                >
                                    <option value="" className="bg-slate-800 text-slate-500">No client (Internal Project)</option>
                                    {clients.map(c => (
                                        <option key={c._id} value={c._id} className="bg-slate-800">{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                                <div className="relative">
                                    <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                    <textarea
                                        rows={4}
                                        value={form.description}
                                        onChange={(e) => update('description', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                        placeholder="Describe the scope of work..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Total Budget</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.budget}
                                        onChange={(e) => update('budget', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks Section */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <ListChecks className="w-5 h-5 text-purple-400" />
                                Initial Tasks
                            </h2>
                            <button
                                type="button"
                                onClick={addTask}
                                className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition"
                            >
                                <Plus className="w-4 h-4" /> Add Task
                            </button>
                        </div>

                        <div className="space-y-4">
                            {tasks.map((task, index) => (
                                <div key={index} className="flex gap-3 group">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={task.title}
                                            onChange={(e) => updateTask(index, 'title', e.target.value)}
                                            placeholder="Task title (e.g. Setting up project structure)"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                        />
                                    </div>
                                    <select
                                        value={task.priority}
                                        onChange={(e) => updateTask(index, 'priority', e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition outline-none"
                                    >
                                        <option value="low" className="bg-slate-800">Low</option>
                                        <option value="medium" className="bg-slate-800">Medium</option>
                                        <option value="high" className="bg-slate-800">High</option>
                                        <option value="urgent" className="bg-slate-800">Urgent</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => removeTask(index)}
                                        disabled={tasks.length === 1 && index === 0}
                                        className="p-2 text-slate-500 hover:text-red-400 transition disabled:opacity-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-4 italic">
                            These tasks will appear automatically in your Tasks Kanban board.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-6 border-b border-white/5 pb-4">Timeline & Status</h2>

                        <div className="space-y-5">
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="date"
                                            value={form.startDate}
                                            onChange={(e) => update('startDate', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
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
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Initial Progress ({form.progress}%)</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={form.progress}
                                    onChange={(e) => update('progress', parseInt(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function NewProjectPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>}>
            <ProjectForm />
        </Suspense>
    );
}
