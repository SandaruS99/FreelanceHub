'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, Download, AlertCircle, Eye, Lock, Unlock, CreditCard } from 'lucide-react';

export default function ProjectPreviewPage() {
    const { token } = useParams();
    const searchParams = useSearchParams();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [payLoading, setPayLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSuccess = searchParams.get('success') === 'true';

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/public/projects/${token}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to fetch project');
                setProject(data.project);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchProject();
    }, [token, isSuccess]);

    // Disable right-click
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    const handlePayHere = async () => {
        setPayLoading(true);
        try {
            const res = await fetch(`/api/public/projects/${token}/pay/hash`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to generate payment link');

            // Create and submit PayHere form
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = 'https://sandbox.payhere.lk/pay/checkout';

            Object.entries(data).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value as string;
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setPayLoading(false);
        }
    };

    const handleSimulatePayment = async () => {
        if (!confirm('This will simulate a successful payment in dev mode. Proceed?')) return;
        try {
            const res = await fetch(`/api/public/projects/${token}/pay/notify`, {
                method: 'POST',
                body: new URLSearchParams({
                    merchant_id: '1234719', // Sandbox ID from .env
                    order_id: token as string,
                    payhere_amount: project.budget.toString(),
                    payhere_currency: project.currency,
                    status_code: '2'
                })
            });
            if (res.ok) window.location.reload();
        } catch (err) {
            alert('Simulation failed');
        }
    };

    const handleDownload = async () => {
        window.location.href = `/api/public/projects/${token}/file`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                <h1 className="text-xl font-bold text-white">Preparing Your Preview...</h1>
                <p className="text-slate-400 mt-2">Connecting to secure delivery link</p>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-white">Invalid Preview Link</h1>
                <p className="text-slate-400 mt-2 max-w-md">{error || 'This preview link is incorrect or has expired.'}</p>
                <a href="/" className="mt-8 px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition">
                    Back to Home
                </a>
            </div>
        );
    }

    const isImage = project.deliveryFileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || project.deliveryFile?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col pb-24 sm:pb-32">
            {/* Header */}
            <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">{project.name}</h1>
                            <p className="text-sm text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                Secure Preview Mode
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Freelancer</p>
                            <p className="text-sm text-white font-semibold">{project.freelancerId?.name}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        {project.isPaid ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-500 text-[10px] font-bold uppercase tracking-widest">
                                <Unlock className="w-3 h-3" /> Paid
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-bold uppercase tracking-widest">
                                <Lock className="w-3 h-3" /> Payment Pending
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Viewer */}
            <main className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden backdrop-blur-3xl">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-6xl w-full bg-slate-900/80 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group min-h-[500px] flex items-center justify-center">
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-[10px] uppercase font-bold text-white/80 tracking-widest animate-pulse">
                        <Eye className="w-3 h-3" />
                        Private Preview
                    </div>

                    {isImage && project.deliveryFile ? (
                        <div className="relative w-full h-full flex items-center justify-center p-8">
                            {/* Watermark */}
                            {!project.isPaid && (
                                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.08]">
                                    <div className="text-[20vw] font-black text-white rotate-[-35deg] tracking-tighter select-none whitespace-nowrap uppercase">
                                        SAMPLE
                                    </div>
                                </div>
                            )}
                            <img
                                src={project.deliveryFile}
                                alt="Preview"
                                className="max-w-full max-h-[70vh] object-contain shadow-2xl rounded-lg"
                                onContextMenu={(e) => e.preventDefault()}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-12">
                            <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center mb-6 border border-purple-500/20">
                                <FileIcon className="w-10 h-10 text-purple-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white leading-tight">Secure File Delivery</h2>
                            <p className="text-slate-400 mt-2 max-w-sm">This is a secure delivery of: <span className="text-purple-400 font-mono italic">{project.deliveryFileName}</span></p>
                            {!project.isPaid && (
                                <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                                    <Lock className="w-4 h-4" /> Unlock Download After Payment
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Pay/Download Action Bar */}
            <div className="fixed bottom-0 inset-x-0 z-[60] p-4 sm:p-6 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-center">
                <div className="max-w-4xl w-full flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="text-center sm:text-left">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Price</p>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-white">{project.budget}</span>
                            <span className="text-lg font-bold text-slate-500">{project.currency}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {!project.isPaid ? (
                            <>
                                <button
                                    onClick={handleSimulatePayment}
                                    className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-bold text-slate-400 uppercase tracking-widest transition"
                                >
                                    Simulate (Dev)
                                </button>
                                <button
                                    onClick={handlePayHere}
                                    disabled={payLoading}
                                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl text-white font-bold shadow-xl shadow-purple-500/30 transition-all scale-100 hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                    {payLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                                    Pay Final Balance
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-3 px-10 py-4 bg-green-600 hover:bg-green-500 rounded-2xl text-white font-bold shadow-xl shadow-green-500/30 transition-all scale-100 hover:scale-105 active:scale-95"
                            >
                                <Download className="w-5 h-5" />
                                Download Final Files
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                body {
                    user-select: none;
                    background-color: #020617;
                }
                @media print {
                    body { display: none; }
                }
            `}</style>
        </div>
    );
}

function FileIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
}
