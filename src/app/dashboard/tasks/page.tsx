'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Loader2, Calendar, AlertCircle } from 'lucide-react';

interface Task {
    _id: string;
    title: string;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    priority: string;
    dueDate?: string;
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
        <div className="max-w-screen-2xl mx-auto pb-12">
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
                <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4">
                    {columns.map((col) => (
                        <div key={col.id} className="flex-1 min-w-[300px] bg-white/5 border border-white/10 rounded-2xl flex flex-col h-[calc(100vh-220px)] overflow-hidden">
                            <div className={`p-4 border-b-2 bg-white/[0.02] flex items-center justify-between ${col.color}`}>
                                <h3 className="font-semibold text-white">{col.title}</h3>
                                <span className="text-xs font-bold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">
                                    {groupedTasks[col.id].length}
                                </span>
                            </div>

                            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                                {groupedTasks[col.id].map((task) => (
                                    <div
                                        key={task._id}
                                        className="bg-slate-900 border border-white/10 hover:border-purple-500/50 rounded-xl p-4 cursor-pointer group transition"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${priorityColors[task.priority]}`}>
                                                {task.priority}
                                            </span>
                                            {/* Simple status mover for UI since HTML Drag/Drop API requires more setup */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <select
                                                    value={task.status}
                                                    onChange={(e) => updateTaskStatus(task._id, e.target.value as Task['status'])}
                                                    className="text-xs bg-slate-800 text-slate-300 border border-slate-700 rounded px-1 py-0.5 outline-none"
                                                >
                                                    <option value="todo">To Do</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="review">Review</option>
                                                    <option value="done">Done</option>
                                                </select>
                                            </div>
                                        </div>

                                        <h4 className="text-white font-medium text-sm mb-3 leading-snug">{task.title}</h4>

                                        {(task.projectId || task.clientId) && (
                                            <div className="mb-3">
                                                <p className="text-xs text-slate-400 truncate">
                                                    {task.projectId?.name || task.clientId?.name}
                                                </p>
                                            </div>
                                        )}

                                        {task.dueDate && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                                {new Date(task.dueDate) < new Date() && task.status !== 'done' && (
                                                    <AlertCircle className="w-3.5 h-3.5 text-red-500 ml-auto" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {groupedTasks[col.id].length === 0 && (
                                    <div className="text-center py-6 border border-dashed border-white/10 rounded-xl text-slate-500 text-sm">
                                        No tasks
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
