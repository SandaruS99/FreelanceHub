import Link from 'next/link';
import { Clock, Mail, ArrowLeft } from 'lucide-react';

export default function PendingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-500/20 border border-amber-500/30 mb-6 shadow-xl shadow-amber-500/10">
                    <Clock className="w-12 h-12 text-amber-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">Account Pending Approval</h1>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    Your account is currently under review. Our team will approve it shortly. You&apos;ll receive an email notification once your account is activated.
                </p>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
                    <div className="flex items-center gap-3 text-left">
                        <Mail className="w-5 h-5 text-purple-400 shrink-0" />
                        <div>
                            <p className="text-white font-medium text-sm">Check your inbox</p>
                            <p className="text-slate-400 text-xs mt-0.5">We&apos;ll send an email when your account is approved.</p>
                        </div>
                    </div>
                </div>
                <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </Link>
            </div>
        </div>
    );
}
