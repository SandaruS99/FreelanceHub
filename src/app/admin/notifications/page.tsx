'use client';

import { useState } from 'react';
import { Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminNotificationsPage() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [target, setTarget] = useState('active');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusData, setStatusData] = useState<{ error?: string, success?: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusData(null);

        try {
            const res = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target, title, message, type })
            });
            const data = await res.json();

            if (!res.ok) {
                setStatusData({ error: data.error || 'Failed to send notification' });
            } else {
                setStatusData({ success: `Successfully sent to ${data.count} users` });
                setTitle('');
                setMessage('');
                setType('info');
            }
        } catch (error: any) {
            setStatusData({ error: error.message || 'An error occurred' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Send Push Notification</h1>
                    <p className="text-slate-400 text-sm mt-1">Broadcast notifications to all users or active users.</p>
                </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                {statusData?.error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-sm text-red-300">Error</p>
                            <p className="text-sm mt-0.5">{statusData.error}</p>
                        </div>
                    </div>
                )}
                {statusData?.success && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-sm text-emerald-300">Success</p>
                            <p className="text-sm mt-0.5">{statusData.success}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-300">Target Audience</label>
                            <select
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium text-sm"
                            >
                                <option value="active">Active Users Only</option>
                                <option value="all">All Users</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-300">Notification Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium text-sm"
                            >
                                <option value="info">Info (Blue)</option>
                                <option value="success">Success (Green)</option>
                                <option value="warning">Warning (Yellow)</option>
                                <option value="error">Error (Red)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Notification Title</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. System Maintenance Update"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Message Content</label>
                        <textarea
                            required
                            rows={4}
                            placeholder="Write the full message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm resize-none"
                        ></textarea>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Sending...' : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send Notification
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
