'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Calendar, CheckSquare, Loader2, ArrowRight } from 'lucide-react';

interface Project {
    _id: string;
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((project) => (
                        <Link
                            key={project._id}
                            href={`/dashboard/projects/${project._id}`}
                            className="bg-white/5 border border-white/10 hover:border-purple-500/30 rounded-2xl p-5 hover:bg-white/10 transition group flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-white font-semibold mb-1 group-hover:text-purple-400 transition">{project.name}</h3>
                                    {project.clientId ? (
                                        <p className="text-slate-400 text-sm">{project.clientId.name}</p>
                                    ) : (
                                        <p className="text-slate-500 text-sm italic">No client assigned</p>
                                    )}
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded border capitalize whitespace-nowrap ${statusColors[project.status]}`}>
                                    {project.status}
                                </span>
                            </div>

                            <div className="space-y-3 mb-6 flex-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Due Date</span>
                                    <span className="text-slate-300">
                                        {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-1.5"><CheckSquare className="w-4 h-4" /> Priority</span>
                                    <span className={`capitalize font-medium ${priorityColors[project.priority]}`}>{project.priority}</span>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-slate-400">Progress</span>
                                        <span className="text-white">{project.progress}%</span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end">
                                <span className="text-purple-400 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                                    Manage <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
