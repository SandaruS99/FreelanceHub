'use client';

import { useState } from 'react';
import { X, Send, Loader2, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface DeliverProjectModalProps {
    projectId: string;
    projectName: string;
    clientName: string;
    clientWhatsapp?: string;
    onSuccess: (project: any) => void;
    onClose: () => void;
}

export default function DeliverProjectModal({
    projectId,
    projectName,
    clientName,
    clientWhatsapp,
    onSuccess,
    onClose
}: DeliverProjectModalProps) {
    const [deliveryFile, setDeliveryFile] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDeliver = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deliveryFile) return setError('Please provide a file URL');

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/projects/${projectId}/deliver`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliveryFile })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delivery failed');

            // Success! Trigger WhatsApp
            const previewUrl = `${window.location.origin}/preview/project/${data.project.deliveryToken}`;
            const message = `Hi ${clientName}, I've finished the project "${projectName}"! 🚀\n\nYou can view the deliverables here: ${previewUrl}\n\nThis is a secure, view-only preview.`;

            if (clientWhatsapp) {
                const waUrl = `https://wa.me/${clientWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                window.open(waUrl, '_blank');
            } else {
                alert('Project delivered! Note: No WhatsApp number was found for this client, so the message couldn\'t be sent automatically.');
            }

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
                        <p className="mt-2 text-[11px] text-slate-500 italic">
                            Tip: For the best experience, use a direct image link from Cloudinary or similar.
                        </p>
                    </div>

                    <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">What happens next?</h4>
                        <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
                            <li>A secure **view-only preview** link will be generated.</li>
                            <li>The project status will be updated to **Completed**.</li>
                            <li>A WhatsApp message will be prepared for **{clientName}**.</li>
                            <li>Watermarks will be applied to protect your designs.</li>
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
