'use client';

import { useState } from 'react';
import { X, Send, Loader2, Link as LinkIcon, AlertCircle, MessageSquare, Phone, Copy, Check, Upload, File as FileIcon, CheckCircle2 } from 'lucide-react';

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
    const [file, setFile] = useState<File | null>(null);
    const [whatsapp, setWhatsapp] = useState(clientWhatsapp || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [successData, setSuccessData] = useState<{ project: any, waUrl: string } | null>(null);

    const formatWhatsAppNumber = (num: string) => {
        let clean = num.replace(/\D/g, '');
        if (clean.startsWith('0') && clean.length === 10) {
            clean = '94' + clean.substring(1);
        }
        return clean;
    };

    const getWhatsAppLink = (number: string, message: string) => {
        const cleanNumber = formatWhatsAppNumber(number);
        const encodedMsg = encodeURIComponent(message);

        const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        return isMobile
            ? `https://wa.me/${cleanNumber}?text=${encodedMsg}`
            : `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMsg}`;
    };

    const previewMessage = `*Hi ${clientName}!* 🚀\n\nI've finished the project *"${projectName}"* and it's ready for your review!\n\n🔗 *View Secure Preview:* ${typeof window !== 'undefined' ? window.location.origin : ''}/preview/project/TOKEN_WILL_BE_HERE\n\nLooking forward to your feedback!`;

    const handleDeliver = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return setError('Please upload a file');
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
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`/api/projects/${projectId}/deliver`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delivery failed');

            // 3. Success! Show success step with synchronous WhatsApp link
            const finalPreviewUrl = `${window.location.origin}/preview/project/${data.project.deliveryToken}`;
            const finalMessage = `*Hi ${clientName}!* 🚀\n\nI've finished the project *"${projectName}"* and it's ready for your review!\n\n🔗 *View Secure Preview:* ${finalPreviewUrl}\n\nLooking forward to your feedback!`;

            const waUrl = getWhatsAppLink(whatsapp, finalMessage);
            
            setSuccessData({
                project: data.project,
                waUrl
            });
            // Note: We don't call onSuccess(data.project) here yet, we will call it when the user closes the success modal.
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    if (successData) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-in p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Project Delivered!</h3>
                    <p className="text-slate-400 text-sm mb-8">
                        The file has been uploaded securely. Click below to notify the client via WhatsApp.
                    </p>

                    <a
                        href={successData.waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                            // Automatically close and update parent state after clicking the link
                            setTimeout(() => {
                                onSuccess(successData.project);
                            }, 500);
                        }}
                        className="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] rounded-xl text-white font-bold text-sm shadow-lg shadow-[#25D366]/20 transition flex items-center justify-center gap-2 mb-4"
                    >
                        <MessageSquare className="w-5 h-5" />
                        Send WhatsApp Message
                    </a>

                    <button
                        onClick={() => onSuccess(successData.project)}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium text-sm transition"
                    >
                        Skip & Close Mode
                    </button>
                </div>
            </div>
        );
    }

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
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Upload Deliverable (Any Format)</label>
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 bg-white/[0.02] cursor-pointer
                                    ${dragActive ? 'border-purple-500 bg-purple-500/10 scale-[1.02]' : 'border-white/10 hover:border-white/20'}`}
                            >
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                />
                                {file ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                                            <FileIcon className="w-6 h-6" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-white truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-[10px] text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-white">Click or drag file to upload</p>
                                            <p className="text-xs text-slate-500 mt-1">Images, PDFs, ZIPs allowed</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Client WhatsApp Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="tel"
                                    required
                                    value={whatsapp}
                                    onChange={(e) => setWhatsapp(e.target.value)}
                                    placeholder="+1 555 000 0000"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl overflow-hidden">
                        <div className="px-4 py-2 bg-purple-500/20 border-b border-purple-500/20 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">WhatsApp Message Preview</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(previewMessage.replace('TOKEN_WILL_BE_HERE', '...'));
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="text-[10px] font-bold text-purple-400 hover:text-white transition flex items-center gap-1"
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'COPIED' : 'COPY'}
                            </button>
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
                            disabled={loading || !file}
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
