'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Calendar, CheckSquare, Loader2, ArrowRight } from 'lucide-react';

interface Project {
    _id: string;
    projectNumber?: string;
    name: string;
    clientId?: {
        _id: string;
        name: string;
        company?: string;
    };
    status: string;
    priority: string;
    startDate?: string;
    endDate?: string;
    progress: number;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        let url = `/api/projects`;
        if (statusFilter !== 'all') {
            url += `?status=${statusFilter}`;
        }
        // Search is not implemented in the API yet, we'll do client-side filtering for now
        const res = await fetch(url);
        const data = await res.json();
        setProjects(data.projects ?? []);
        setLoading(false);
    }, [statusFilter]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.projectNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        p.clientId?.name.toLowerCase().includes(search.toLowerCase())
    );

    const statusColors: Record<string, string> = {
        planning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        active: 'bg-green-500/20 text-green-400 border-green-500/30',
        completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    const priorityColors: Record<string, string> = {
        low: 'text-slate-400',
        medium: 'text-blue-400',
        high: 'text-amber-400',
        urgent: 'text-red-400',
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Projects</h1>
                    <p className="text-slate-400 mt-1">Manage all your ongoing client work and deliverables.</p>
                </div>
                <Link
                    href="/dashboard/projects/new"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl transition shadow-lg shadow-purple-500/30"
                >
                    <Plus className="w-5 h-5" />
                    New Project
                </Link>
            </div>

            {/* Toolbar */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
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
                    <option value="planning" className="bg-slate-800">Planning</option>
                    <option value="active" className="bg-slate-800">Active</option>
                    <option value="paused" className="bg-slate-800">Paused</option>
                    <option value="completed" className="bg-slate-800">Completed</option>
                </select>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">No projects found</h3>
                    <p className="text-slate-400 max-w-sm mx-auto mb-6">
                        Get started by creating a new project.
                    </p>
                    <Link
                        href="/dashboard/projects/new"
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-2.5 rounded-xl transition"
                    >
                        <Plus className="w-4 h-4" /> New Project
                    </Link>
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-white/[0.02] border-b border-white/10 text-slate-300">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Project ID</th>
                                    <th className="px-6 py-4 font-medium">Project Name</th>
                                    <th className="px-6 py-4 font-medium">Client</th>
                                    <th className="px-6 py-4 font-medium">Progress</th>
                                    <th className="px-6 py-4 font-medium">Due Date</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredProjects.map((project) => (
                                    <tr key={project._id} className="hover:bg-white/[0.02] transition group">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {project.projectNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium group-hover:text-purple-400 transition">
                                                {project.name}
                                            </div>
                                            <div className={`text-xs capitalize font-medium mt-1 ${priorityColors[project.priority]}`}>
                                                {project.priority} priority
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {project.clientId ? (
                                                <span className="text-slate-300">
                                                    {project.clientId.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 italic">No client</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 bg-white/10 rounded-full h-1.5 overflow-hidden shrink-0">
                                                    <div
                                                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                                                        style={{ width: `${project.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-white">{project.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border capitalize whitespace-nowrap ${statusColors[project.status]}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/dashboard/projects/${project._id}`} className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium">
                                                    Manage <ArrowRight className="w-4 h-4" />
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
