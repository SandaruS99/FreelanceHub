'use client';

import { useState } from 'react';
import { X, Send, Loader2, Link as LinkIcon, AlertCircle, MessageSquare, Phone } from 'lucide-react';

interface DeliverProjectModalProps {
    projectId: string;
    projectName: string;
    clientId: string;
    clientName: string;
    clientWhatsapp?: string;
    onSuccess: (project: any) => void;
    onClose: () => void;
}

export default function DeliverProjectModal({
    projectId,
    projectName,
    clientId,
    clientName,
    clientWhatsapp,
    onSuccess,
    onClose
}: DeliverProjectModalProps) {
    const [deliveryFile, setDeliveryFile] = useState('');
    const [whatsapp, setWhatsapp] = useState(clientWhatsapp || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getWhatsAppLink = (number: string, message: string) => {
        const cleanNumber = number.replace(/\D/g, '');
        const encodedMsg = encodeURIComponent(message);

        // Use a simple heuristic for mobile detection (could be more robust)
        const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        return isMobile
            ? `https://wa.me/${cleanNumber}?text=${encodedMsg}`
            : `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMsg}`;
    };

    const previewMessage = `*Hi ${clientName}!* 🚀\n\nI've finished the project *"${projectName}"* and it's ready for your review!\n\n🔗 *View Secure Preview:* ${window.location.origin}/preview/project/TOKEN_WILL_BE_HERE\n\nLooking forward to your feedback!`;

    const handleDeliver = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deliveryFile) return setError('Please provide a file URL');
        if (!whatsapp) return setError('Please provide a WhatsApp number for the client');

        setLoading(true);
        setError(null);

        try {
            // 1. Update client WhatsApp if changed
            if (whatsapp !== clientWhatsapp) {
                await fetch(`/api/clients/${clientId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ whatsapp })
                });
            }

            // 2. Deliver project
            const res = await fetch(`/api/projects/${projectId}/deliver`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliveryFile })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delivery failed');

            // 3. Success! Trigger WhatsApp
            const finalPreviewUrl = `${window.location.origin}/preview/project/${data.project.deliveryToken}`;
            const finalMessage = `*Hi ${clientName}!* 🚀\n\nI've finished the project *"${projectName}"* and it's ready for your review!\n\n🔗 *View Secure Preview:* ${finalPreviewUrl}\n\nLooking forward to your feedback!`;

            const waUrl = getWhatsAppLink(whatsapp, finalMessage);
            window.open(waUrl, '_blank');

            onSuccess(data.project);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden scale-in">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Send className="w-5 h-5 text-purple-500" />
                        Deliver Project
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleDeliver} className="p-6 space-y-6">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Project File URL</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="url"
                                    required
                                    value={deliveryFile}
                                    onChange={(e) => setDeliveryFile(e.target.value)}
                                    placeholder="https://cloudinary.com/your-image.jpg"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Client WhatsApp</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="tel"
                                    required
                                    value={whatsapp}
                                    onChange={(e) => setWhatsapp(e.target.value)}
                                    placeholder="+1 555 000 0000"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl overflow-hidden">
                        <div className="px-4 py-2 bg-purple-500/20 border-b border-purple-500/20 flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">WhatsApp Message Preview</span>
                        </div>
                        <div className="p-4">
                            <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono italic">
                                {previewMessage}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-purple-500" />
                            Next Steps
                        </h4>
                        <ul className="text-[11px] text-slate-500 space-y-1.5 list-disc pl-4">
                            <li>Generate secure **view-only preview** with watermarks.</li>
                            <li>Automatically prepare professional **WhatsApp link**.</li>
                            <li>Update Project status to **Completed**.</li>
                        </ul>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white text-sm font-bold shadow-lg shadow-purple-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Deliver & Notify
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
