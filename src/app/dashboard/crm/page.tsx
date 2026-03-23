'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mail, Phone, MessageCircle, Video, FileText, Loader2, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';

interface CrmLog {
    _id: string;
    clientId: { _id: string; name: string; company?: string };
    type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note';
    date: string;
    content: string;
    followUpDate?: string;
}

export default function CrmPage() {
    const [logs, setLogs] = useState<CrmLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/crm');
        const data = await res.json();
        setLogs(data.logs ?? []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'call': return <Phone className="w-4 h-4 text-blue-400" />;
            case 'email': return <Mail className="w-4 h-4 text-emerald-400" />;
            case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-400" />;
            case 'meeting': return <Video className="w-4 h-4 text-purple-400" />;
            default: return <FileText className="w-4 h-4 text-slate-400" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'call': return 'bg-blue-500/10 border-blue-500/20';
            case 'email': return 'bg-emerald-500/10 border-emerald-500/20';
            case 'whatsapp': return 'bg-green-500/10 border-green-500/20';
            case 'meeting': return 'bg-purple-500/10 border-purple-500/20';
            default: return 'bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">CRM Log</h1>
                    <p className="text-slate-400 mt-1">A unified timeline of all your client communications.</p>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No communication logged</h3>
                        <p className="text-slate-400 max-w-sm mx-auto mb-6">
                            Go to a Client&apos;s profile to add your first note, call, or meeting record.
                        </p>
                        <Link
                            href="/dashboard/clients"
                            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-2.5 rounded-xl transition"
                        >
                            Go to Clients
                        </Link>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-white/5 ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-10">
                        {logs.map((log) => (
                            <div key={log._id} className="relative group">
                                {/* Timeline dot */}
                                <div className={`absolute -left-[35px] sm:-left-[43px] w-8 h-8 rounded-full border flex items-center justify-center ${getBgColor(log.type)} bg-slate-900`}>
                                    {getIcon(log.type)}
                                </div>

                                <div className="bg-slate-900/50 border border-white/5 group-hover:border-white/10 rounded-xl p-5 transition">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-semibold">
                                                <Link href={`/dashboard/clients/${log.clientId._id}`} className="hover:text-purple-400 transition">
                                                    {log.clientId.name}
                                                </Link>
                                            </span>
                                            <span className="text-slate-600 text-sm">•</span>
                                            <span className="text-slate-400 text-sm capitalize">{log.type}</span>
                                        </div>
                                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(log.date).toLocaleString(undefined, {
                                                dateStyle: 'medium', timeStyle: 'short'
                                            })}
                                        </span>
                                    </div>

                                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                        {log.content}
                                    </p>

                                    {log.followUpDate && (
                                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                                            <span className="text-xs font-semibold text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                                Follow-up needed
                                            </span>
                                            <span className="text-xs text-amber-500/80">
                                                {new Date(log.followUpDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
