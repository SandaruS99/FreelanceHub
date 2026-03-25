'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, ShieldCheck, Download, AlertCircle, Eye } from 'lucide-react';

export default function ProjectPreviewPage() {
    const { token } = useParams();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
    }, [token]);

    // Disable right-click
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

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

    const isImage = project.deliveryFile.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
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
                                Secure Preview Mode (View Only)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Delivered By</p>
                            <p className="text-sm text-white font-semibold">{project.freelancerId?.name || 'Freelancer'}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10 mx-2 hidden md:block"></div>
                        <button
                            disabled
                            title="Download is disabled in preview mode"
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-500 border border-white/5 rounded-xl cursor-not-allowed opacity-50 text-sm font-medium"
                        >
                            <Download className="w-4 h-4" />
                            Download Project
                        </button>
                    </div>
                </div>
            </header>

            {/* Viewer */}
            <main className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden backdrop-blur-3xl">
                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-6xl w-full bg-slate-900/80 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group">
                    {/* View Only Overlay */}
                    <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-[10px] uppercase font-bold text-white/80 tracking-widest animate-pulse">
                        <Eye className="w-3 h-3" />
                        View Only
                    </div>

                    {isImage ? (
                        <div className="relative w-full h-full min-h-[400px] flex items-center justify-center p-4 bg-slate-950/50">
                            {/* Watermark Overlay */}
                            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.08]">
                                <div className="text-[20vw] font-black text-white rotate-[-35deg] tracking-tighter select-none whitespace-nowrap">
                                    SAMPLE CODE
                                </div>
                            </div>
                            <div className="absolute inset-0 z-10 pointer-events-none grid grid-cols-4 grid-rows-4 opacity-[0.03]">
                                {Array.from({ length: 16 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-center text-4xl font-black text-white rotate-[-35deg] select-none uppercase">
                                        SAMPLE
                                    </div>
                                ))}
                            </div>

                            <img
                                src={project.deliveryFile}
                                alt="Project Deliverable"
                                className="max-w-full max-h-[75vh] object-contain shadow-2xl rounded-lg selection:bg-transparent"
                                onContextMenu={(e) => e.preventDefault()}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center p-6 bg-slate-950/50">
                            <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center mb-6 border border-purple-500/20">
                                <ShieldCheck className="w-10 h-10 text-purple-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white leading-tight">Secure Document Preview</h2>
                            <p className="text-slate-400 mt-2 max-w-md mx-auto">This project delivery includes a file that can only be downloaded by verified users. Contact your freelancer to receive the final version.</p>
                            <div className="mt-8 p-4 bg-white/5 border border-white/5 rounded-2xl inline-block max-w-sm truncate text-sm text-slate-500 font-mono italic">
                                {project.deliveryFile.split('/').pop()}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="p-6 text-center border-t border-white/5 bg-slate-900/30">
                <p className="text-xs text-slate-500 font-medium tracking-wide">
                    &copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME || 'FreelanceHub'}. Pro-Grade Client Delivery Engine.
                </p>
            </footer>

            <style jsx global>{`
                body {
                    user-select: none;
                }
                @media print {
                    body { display: none; }
                }
            `}</style>
        </div>
    );
}
