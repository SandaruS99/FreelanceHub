'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Calendar, Loader2, Trash2, Edit, CheckSquare,
    AlignLeft, DollarSign, Building2, User
} from 'lucide-react';

interface Project {
    _id: string;
    name: string;
    description?: string;
    clientId?: {
        _id: string;
        name: string;
        company?: string;
    };
    status: string;
    priority: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    progress: number;
}

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingProgress, setUpdatingProgress] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetch(`/api/projects/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.project) setProject(data.project);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this project? Tasks linked to this project will remain but lose their project association.')) return;
        setDeleting(true);
        await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        router.push('/dashboard/projects');
        router.refresh();
    };

    const updateProgress = async (newProgress: number) => {
        if (!project) return;
        setUpdatingProgress(true);
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ progress: newProgress })
            });
            const data = await res.json();
            if (data.project) setProject(data.project);
        } finally {
            setUpdatingProgress(false);
        }
    };

    const statusColors: Record<string, string> = {
        planning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        active: 'bg-green-500/20 text-green-400 border-green-500/30',
        completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white mb-2">Project Not Found</h2>
                <Link href="/dashboard/projects" className="text-purple-400 hover:text-purple-300">
                    Back to Projects
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
                        href="/dashboard/projects"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                            <span className={`text-xs px-2.5 py-0.5 rounded capitalize border ${statusColors[project.status]}`}>
                                {project.status}
                            </span>
                        </div>
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
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Overview</h3>
                        <div className="space-y-6">
                            {project.description ? (
                                <div>
                                    <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                        <AlignLeft className="w-4 h-4 text-slate-500" /> Description
                                    </h4>
                                    <p className="text-slate-400 text-sm whitespace-pre-wrap leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                        {project.description}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm italic">No description provided.</p>
                            )}

                            {/* Progress Tracker Slider */}
                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium text-slate-300">Project Progress</h4>
                                    <span className="text-white font-bold">{project.progress}%</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={project.progress}
                                        disabled={updatingProgress}
                                        onChange={(e) => updateProgress(parseInt(e.target.value))}
                                        className={`flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 ${updatingProgress ? 'opacity-50' : ''}`}
                                    />
                                    {updatingProgress && <Loader2 className="w-4 h-4 text-purple-500 animate-spin shrink-0" />}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-purple-400" /> Tasks
                        </h3>
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                            <p className="text-slate-400 text-sm">Task management coming soon.</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Project Details</h3>

                        <div className="space-y-5">
                            <div>
                                <p className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-500" /> Client
                                </p>
                                {project.clientId ? (
                                    <Link href={`/dashboard/clients/${project.clientId._id}`} className="text-white font-medium hover:text-purple-400 transition">
                                        {project.clientId.name}
                                        {project.clientId.company && (
                                            <span className="block text-xs text-slate-400 font-normal mt-0.5">
                                                <Building2 className="w-3 h-3 inline mr-1" />{project.clientId.company}
                                            </span>
                                        )}
                                    </Link>
                                ) : (
                                    <span className="text-slate-500 italic text-sm">Internal Project</span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-400 mb-1">Priority</p>
                                    <span className="text-white capitalize font-medium">{project.priority}</span>
                                </div>
                                {project.budget && (
                                    <div>
                                        <p className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-1">
                                            <DollarSign className="w-3.5 h-3.5" /> Budget
                                        </p>
                                        <span className="text-white font-medium">${project.budget.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-500" /> Start Date
                                    </p>
                                    <p className="text-white text-sm">
                                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not Set'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-500" /> Target End Date
                                    </p>
                                    <p className="text-white text-sm">
                                        {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not Set'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
