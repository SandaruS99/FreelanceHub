'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Loader2, Calendar, AlertCircle, Info, User, Briefcase, AlignLeft, Clock } from 'lucide-react';

interface Task {
    _id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    priority: string;
    dueDate?: string;
    createdAt: string;
    projectId?: { _id: string; name: string };
    clientId?: { _id: string; name: string };
}

type ColumnsType = {
    [key in Task['status']]: Task[];
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/tasks');
        const data = await res.json();
        setTasks(data.tasks ?? []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
        // Optimistic UI update
        setTasks((prev) =>
            prev.map((t) => t._id === taskId ? { ...t, status: newStatus } : t)
        );

        // Persist to DB
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
            // Revert if failed
            fetchTasks();
        }
    };

    const priorityColors: Record<string, string> = {
        low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    const columns: { id: Task['status']; title: string; color: string }[] = [
        { id: 'todo', title: 'To Do', color: 'border-slate-500/50' },
        { id: 'in-progress', title: 'In Progress', color: 'border-blue-500/50' },
        { id: 'review', title: 'In Review', color: 'border-amber-500/50' },
        { id: 'done', title: 'Done', color: 'border-green-500/50' },
    ];

    const groupedTasks: ColumnsType = {
        'todo': tasks.filter((t) => t.status === 'todo'),
        'in-progress': tasks.filter((t) => t.status === 'in-progress'),
        'review': tasks.filter((t) => t.status === 'review'),
        'done': tasks.filter((t) => t.status === 'done'),
    };

    return (
        <div className="w-full pb-12 overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Tasks Kanban</h1>
                    <p className="text-slate-400 mt-1">Drag and drop tasks across your workflow.</p>
                </div>
                <Link
                    href="/dashboard/tasks/new"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl transition shadow-lg shadow-purple-500/30"
                >
                    <Plus className="w-5 h-5" />
                    Add Task
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
            ) : (
                <div className="w-full overflow-x-hidden">
                    {/* Horizontal Scroll Container - isolated to board only */}
                    <div className="w-full overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent rounded-2xl">
                        <div className="flex gap-6 pb-2" style={{ width: 'max-content' }}>
                            {columns.map((col) => (
                                <div 
                                    key={col.id} 
                                    className="w-[320px] bg-white/5 border border-white/10 rounded-2xl flex flex-col h-[calc(100vh-240px)] min-h-[500px] overflow-hidden transition-all duration-300"
                                >
                                    {/* Column Header */}
                                    <div className={`p-4 border-b-2 bg-white/[0.02] flex items-center justify-between ${col.color}`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${col.id === 'todo' ? 'bg-slate-500' : col.id === 'in-progress' ? 'bg-blue-500' : col.id === 'review' ? 'bg-amber-500' : 'bg-green-500'}`} />
                                            <h3 className="font-semibold text-white text-sm">{col.title}</h3>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">
                                            {groupedTasks[col.id].length}
                                        </span>
                                    </div>

                                    {/* Tasks List */}
                                    <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                        {groupedTasks[col.id].map((task) => (
                                            <div
                                                key={task._id}
                                                className="bg-slate-900/50 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 rounded-xl p-4 cursor-pointer group transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5"
                                            >
                                                <div className="flex justify-between items-start mb-2.5">
                                                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border tracking-wider ${priorityColors[task.priority]}`}>
                                                        {task.priority}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative group/info">
                                                            <Info className="w-4 h-4 text-slate-500 hover:text-purple-400 transition-colors cursor-help" />
                                                            
                                                            {/* Tooltip Content */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl invisible group-hover/info:visible opacity-0 group-hover/info:opacity-100 transition-all duration-200 z-50 pointer-events-none">
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2 text-white font-medium text-xs border-b border-white/5 pb-2 mb-2">
                                                                        <Info className="w-3.5 h-3.5 text-purple-400" />
                                                                        Task Details
                                                                    </div>
                                                                    
                                                                    {(task.clientId || task.projectId) && (
                                                                        <div className="space-y-2">
                                                                            {task.clientId && (
                                                                                <div className="flex items-start gap-2 text-[11px]">
                                                                                    <User className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                                                                    <div>
                                                                                        <p className="text-slate-500 leading-none mb-1">Client</p>
                                                                                        <p className="text-slate-200 font-medium">{task.clientId.name}</p>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {task.projectId && (
                                                                                <div className="flex items-start gap-2 text-[11px]">
                                                                                    <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                                                                    <div>
                                                                                        <p className="text-slate-500 leading-none mb-1">Project</p>
                                                                                        <p className="text-slate-200 font-medium">{task.projectId.name}</p>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {task.description && (
                                                                        <div className="flex items-start gap-2 text-[11px] pt-1 border-t border-white/5">
                                                                            <AlignLeft className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                                                            <div>
                                                                                <p className="text-slate-500 leading-none mb-1">Description</p>
                                                                                <p className="text-slate-300 line-clamp-3 leading-relaxed">{task.description}</p>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-2 border-t border-white/5 mt-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        Created on {new Date(task.createdAt).toLocaleDateString()}
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Tooltip Arrow */}
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 opacity-10 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <select
                                                                value={task.status}
                                                                onChange={(e) => updateTaskStatus(task._id, e.target.value as Task['status'])}
                                                                className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-purple-500/50"
                                                            >
                                                                <option value="todo">To Do</option>
                                                                <option value="in-progress">In Progress</option>
                                                                <option value="review">Review</option>
                                                                <option value="done">Done</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <h4 className="text-white font-medium text-sm mb-3 leading-snug group-hover:text-purple-300 transition-colors">{task.title}</h4>

                                                {task.projectId && (
                                                    <div className="mb-3 flex items-center gap-1.5">
                                                        <div className="w-1 h-3 bg-purple-500/50 rounded-full" />
                                                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                                            {task.projectId.name}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                                                    {task.dueDate ? (
                                                        <div className={`flex items-center gap-1.5 text-[10px] ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-400' : 'text-slate-500'}`}>
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                        </div>
                                                    ) : <div />}
                                                    
                                                    {task.clientId && !task.projectId && (
                                                        <span className="text-[10px] text-slate-500 italic truncate max-w-[100px]">
                                                            {task.clientId.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {groupedTasks[col.id].length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/5 rounded-xl text-slate-600 text-xs">
                                                <AlertCircle className="w-4 h-4 mb-2 opacity-20" />
                                                No tasks
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
