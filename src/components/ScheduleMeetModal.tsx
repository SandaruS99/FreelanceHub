'use client';

import { useState } from 'react';
import {
    X, Calendar, Clock, Video, Loader2, CheckCircle2,
    AlertCircle, ExternalLink, Copy, Check
} from 'lucide-react';

interface ScheduleMeetModalProps {
    projectId: string;
    projectName: string;
    clientName: string;
    clientEmail?: string;
    onSuccess: (meetLink: string) => void;
    onClose: () => void;
}

const DURATIONS = [
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
];

// Returns a local datetime string suitable for <input type="datetime-local">
function getDefaultDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // default: 30 min from now
    // Format: YYYY-MM-DDTHH:MM (datetime-local format)
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function ScheduleMeetModal({
    projectId,
    projectName,
    clientName,
    clientEmail,
    onSuccess,
    onClose,
}: ScheduleMeetModalProps) {
    const [startDateTime, setStartDateTime] = useState(getDefaultDateTime());
    const [duration, setDuration] = useState(60);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [meetLink, setMeetLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSchedule = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/projects/${projectId}/meet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDateTime: new Date(startDateTime).toISOString(),
                    durationMinutes: duration,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to create meeting. Please try again.');
                return;
            }

            setMeetLink(data.meetLink);
            onSuccess(data.meetLink);
        } catch {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyLink = async () => {
        if (!meetLink) return;
        await navigator.clipboard.writeText(meetLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden">
                {/* Gradient top bar */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Video className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Schedule Meeting</h2>
                            <p className="text-xs text-slate-500 truncate max-w-[220px]">{projectName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Success state */}
                    {meetLink ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-emerald-400">Meeting Created!</p>
                                    <p className="text-xs text-slate-400 mt-0.5">The invite has been sent to {clientName}.</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Google Meet Link</p>
                                <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                                    <input
                                        readOnly
                                        value={meetLink}
                                        className="bg-transparent border-none text-xs text-blue-400 font-mono flex-1 focus:outline-none truncate"
                                    />
                                    <button
                                        onClick={copyLink}
                                        className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-400 hover:text-white shrink-0"
                                        title="Copy link"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                    <a
                                        href={meetLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-400 hover:text-white shrink-0"
                                        title="Open Meet"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium text-sm rounded-xl transition"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Client info */}
                            <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                                <span className="text-xs text-slate-500">Inviting</span>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-white">{clientName}</p>
                                    <p className="text-xs text-slate-400">{clientEmail || 'No email on file'}</p>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-400 leading-snug">{error}</p>
                                </div>
                            )}

                            {/* Date & Time */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                    Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={startDateTime}
                                    onChange={(e) => setStartDateTime(e.target.value)}
                                    min={getDefaultDateTime()}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition [color-scheme:dark]"
                                />
                            </div>

                            {/* Duration */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                                    <Clock className="w-4 h-4 text-slate-500" />
                                    Duration
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {DURATIONS.map(({ label, value }) => (
                                        <button
                                            key={value}
                                            onClick={() => setDuration(value)}
                                            className={`py-2 rounded-xl text-xs font-semibold transition border ${
                                                duration === value
                                                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                                                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CTA */}
                            <button
                                onClick={handleSchedule}
                                disabled={loading || !startDateTime || !clientEmail}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-blue-500/20"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating Meeting...
                                    </>
                                ) : (
                                    <>
                                        <Video className="w-4 h-4" />
                                        Create Google Meet
                                    </>
                                )}
                            </button>

                            {!clientEmail && (
                                <p className="text-center text-xs text-amber-400/80">
                                    ⚠️ This client has no email address. Please add one to schedule meetings.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
