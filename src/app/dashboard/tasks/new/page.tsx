'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Calendar, LayoutList } from 'lucide-react';

function TaskForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedProject = searchParams.get('project');
    const preSelectedClient = searchParams.get('client');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [clients, setClients] = useState<{ _id: string; name: string }[]>([]);
    const [projects, setProjects] = useState<{ _id: string; name: string; clientId?: { _id: string } }[]>([]);

    const [form, setForm] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
        projectId: preSelectedProject || '',
        clientId: preSelectedClient || '',
    });

    useEffect(() => {
        Promise.all([
            fetch('/api/clients').then(res => res.json()),
            fetch('/api/projects').then(res => res.json()),
        ]).then(([clientsData, projectsData]) => {
            if (clientsData.clients) setClients(clientsData.clients);
            if (projectsData.projects) setProjects(projectsData.projects);
        }).catch(err => console.error(err));
    }, []);

    // When project changes, optionally auto-select the parent client
    useEffect(() => {
        if (form.projectId) {
            const proj = projects.find(p => p._id === form.projectId);
            if (proj && proj.clientId) {
                setForm(prev => ({ ...prev, clientId: proj.clientId!._id }));
            }
        }
    }, [form.projectId, projects]);

    const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Clean up empty strings to undefined so Mongoose doesn't throw CastErrors on ObjectIds
        const payload = { ...form };
        if (!payload.projectId) delete (payload as any).projectId;
        if (!payload.clientId) delete (payload as any).clientId;

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create task');
            }

            router.push('/dashboard/tasks');
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

    // Filter projects by selected client if client is selected
    const availableProjects = form.clientId
        ? projects.filter(p => !p.clientId || p.clientId._id === form.clientId)
        : projects;

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/tasks"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Create New Task</h1>
                        <p className="text-slate-400 text-sm mt-1">Add a new to-do to your workflow.</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading || !form.title}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Task
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 transition shrink-0">&times;</button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Task Title *</label>
                            <input
                                type="text"
                                required
                                value={form.title}
                                onChange={(e) => update('title', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                placeholder="e.g., Design homepage wireframes"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                            <div className="relative">
                                <LayoutList className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) => update('description', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
                                    placeholder="Task details and sub-steps..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-white/5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Client (Optional)</label>
                                <select
                                    value={form.clientId}
                                    onChange={(e) => update('clientId', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                >
                                    <option value="" className="bg-slate-800 text-slate-500">No client (Internal)</option>
                                    {clients.map(c => <option key={c._id} value={c._id} className="bg-slate-800">{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Project (Optional)</label>
                                <select
                                    value={form.projectId}
                                    onChange={(e) => update('projectId', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    disabled={availableProjects.length === 0}
                                >
                                    <option value="" className="bg-slate-800 text-slate-500">No project</option>
                                    {availableProjects.map(p => <option key={p._id} value={p._id} className="bg-slate-800">{p.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-white/5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => update('status', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                >
                                    <option value="todo" className="bg-slate-800">To Do</option>
                                    <option value="in-progress" className="bg-slate-800">In Progress</option>
                                    <option value="review" className="bg-slate-800">Review</option>
                                    <option value="done" className="bg-slate-800">Done</option>
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
                                    <option value="urgent" className="bg-slate-800">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Due Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="date"
                                        value={form.dueDate}
                                        onChange={(e) => update('dueDate', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function NewTaskPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>}>
            <TaskForm />
        </Suspense>
    );
}
